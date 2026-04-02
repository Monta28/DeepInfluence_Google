const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');
const crypto = require('crypto');

/**
 * PHASE 2 - Contrôleur pour la gestion des paiements Flouci
 */
class PaymentController {
  /**
   * PHASE 2 - Acheter un pack de coins via Flouci
   * @route POST /api/payments/buy-coins
   * @access Private
   */
  static async buyCoinPack(req, res) {
    try {
      const { coinPackId } = req.body;
      const userId = req.user.id;

      if (!coinPackId) {
        return ApiResponse.badRequest(res, 'Vous devez sélectionner un pack de coins');
      }

      // Récupérer le pack de coins
      const coinPack = await prisma.coinPack.findUnique({
        where: { id: parseInt(coinPackId) }
      });

      if (!coinPack) {
        return ApiResponse.notFound(res, 'Pack de coins non trouvé');
      }

      if (!coinPack.active) {
        return ApiResponse.badRequest(res, 'Ce pack n\'est pas disponible');
      }

      // Convertir TND en millimes (1 TND = 1000 millimes)
      const priceTND = parseFloat(coinPack.priceTND);
      const amountMillimes = Math.round(priceTND * 1000);
      const totalCoins = coinPack.coins + coinPack.bonus;

      // Créer le paiement en base (status PENDING)
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: amountMillimes,
          amountTND: priceTND,
          coins: totalCoins,
          status: 'PENDING',
          paymentMethod: 'FLOUCI',
          type: 'COIN_PURCHASE',
          metadata: JSON.stringify({
            coinPackId: coinPack.id,
            packName: coinPack.name,
            baseCoins: coinPack.coins,
            bonusCoins: coinPack.bonus
          })
        }
      });

      // Préparer la requête Flouci
      // API Docs: https://flouci.com/docs/api
      const flouciAppToken = process.env.FLOUCI_APP_TOKEN;
      const flouciAppSecret = process.env.FLOUCI_APP_SECRET;

      if (!flouciAppToken || !flouciAppSecret) {
        console.error('Flouci credentials not configured');
        return ApiResponse.error(res, 'Configuration de paiement manquante');
      }

      // Créer la requête de paiement Flouci
      const flouciPayload = {
        app_token: flouciAppToken,
        app_secret: flouciAppSecret,
        amount: amountMillimes,
        accept_card: true,
        session_timeout_secs: 1200, // 20 minutes
        success_link: `${process.env.FRONTEND_URL}/payment/success?payment_id=${payment.id}`,
        fail_link: `${process.env.FRONTEND_URL}/payment/failed?payment_id=${payment.id}`,
        developer_tracking_id: `PAYMENT_${payment.id}`
      };

      try {
        const flouciResponse = await fetch('https://developers.flouci.com/api/generate_payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(flouciPayload)
        });

        const flouciData = await flouciResponse.json();

        if (!flouciResponse.ok || !flouciData.result?.link) {
          console.error('Flouci API error:', flouciData);

          // Marquer le paiement comme échoué
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureReason: String(flouciData.error?.message || 'Erreur Flouci API').slice(0, 255)
            }
          });

          return ApiResponse.error(res, 'Erreur lors de la génération du lien de paiement');
        }

        // Sauvegarder les détails Flouci
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            flouciPaymentId: flouciData.result.payment_id || null,
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata),
              flouciPaymentId: flouciData.result.payment_id,
              flouciLink: flouciData.result.link
            })
          }
        });

        // Retourner le lien de paiement au frontend
        return ApiResponse.success(res, {
          paymentId: updatedPayment.id,
          flouciPaymentUrl: flouciData.result.link,
          amount: coinPack.priceTND,
          coins: coinPack.coins,
          bonus: coinPack.bonus,
          total: coinPack.coins + coinPack.bonus
        }, 'Lien de paiement généré');
      } catch (fetchError) {
        console.error('Flouci fetch error:', fetchError);

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: 'Erreur de connexion au service Flouci'
          }
        });

        return ApiResponse.error(res, 'Erreur de connexion au service de paiement');
      }
    } catch (error) {
      console.error('Buy coin pack error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'achat de coins');
    }
  }

  /**
   * PHASE 2 - Acheter une vidéo via Flouci (paiement direct en TND)
   * @route POST /api/payments/buy-video
   * @access Private
   */
  static async buyVideo(req, res) {
    try {
      const { videoId } = req.body;
      const userId = req.user.id;

      if (!videoId) {
        return ApiResponse.badRequest(res, 'Vous devez sélectionner une vidéo');
      }

      const video = await prisma.video.findUnique({
        where: { id: parseInt(videoId) },
        select: { id: true, title: true, price: true, type: true, accessType: true, expertId: true, expert: true }
      });

      if (!video) {
        return ApiResponse.notFound(res, 'Vidéo non trouvée');
      }

      if ((video.type === 'free' || video.accessType === 'FREE') && (video.price || 0) === 0) {
        return ApiResponse.badRequest(res, 'Cette vidéo est gratuite');
      }

      // Vérifier si déjà achetée
      const existing = await prisma.userVideo.findUnique({
        where: { userId_videoId: { userId, videoId: parseInt(videoId) } }
      });
      if (existing) {
        return ApiResponse.badRequest(res, 'Vous avez déjà acheté cette vidéo');
      }

      // Convertir le prix en coins vers TND (1 coin = 0.05 TND, basé sur 100 coins = 5 TND)
      const coinPrice = video.price || 0;
      const priceTND = Math.max(0.5, parseFloat((coinPrice * 0.05).toFixed(3))); // Minimum 0.5 TND
      const amountMillimes = Math.round(priceTND * 1000);

      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: amountMillimes,
          amountTND: priceTND,
          coins: 0,
          status: 'PENDING',
          paymentMethod: 'FLOUCI',
          type: 'VIDEO_PURCHASE',
          metadata: JSON.stringify({
            videoId: video.id,
            videoTitle: video.title,
            coinPrice: coinPrice
          })
        }
      });

      const flouciAppToken = process.env.FLOUCI_APP_TOKEN;
      const flouciAppSecret = process.env.FLOUCI_APP_SECRET;

      if (!flouciAppToken || !flouciAppSecret) {
        return ApiResponse.error(res, 'Configuration de paiement manquante');
      }

      const flouciPayload = {
        app_token: flouciAppToken,
        app_secret: flouciAppSecret,
        amount: amountMillimes,
        accept_card: true,
        session_timeout_secs: 1200,
        success_link: `${process.env.FRONTEND_URL}/payment/success?payment_id=${payment.id}`,
        fail_link: `${process.env.FRONTEND_URL}/payment/failed?payment_id=${payment.id}`,
        developer_tracking_id: `PAYMENT_${payment.id}`
      };

      try {
        const flouciResponse = await fetch('https://developers.flouci.com/api/generate_payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flouciPayload)
        });

        const flouciData = await flouciResponse.json();

        if (!flouciResponse.ok || !flouciData.result?.link) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED', failureReason: String(flouciData.error?.message || 'Erreur Flouci').slice(0, 255) }
          });
          return ApiResponse.error(res, 'Erreur lors de la génération du lien de paiement');
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            flouciPaymentId: flouciData.result.payment_id || null,
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata),
              flouciPaymentId: flouciData.result.payment_id,
              flouciLink: flouciData.result.link
            })
          }
        });

        return ApiResponse.success(res, {
          paymentId: payment.id,
          flouciPaymentUrl: flouciData.result.link,
          amount: priceTND,
          videoTitle: video.title
        }, 'Lien de paiement généré');
      } catch (fetchError) {
        console.error('Flouci fetch error:', fetchError);
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', failureReason: 'Erreur de connexion Flouci' }
        });
        return ApiResponse.error(res, 'Erreur de connexion au service de paiement');
      }
    } catch (error) {
      console.error('Buy video error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'achat de la vidéo');
    }
  }

  /**
   * PHASE 2 - Vérifier le statut d'un paiement auprès de Flouci
   * @route GET /api/payments/:id/verify
   * @access Private
   */
  static async verifyPayment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Récupérer le paiement
      const payment = await prisma.payment.findUnique({
        where: { id: parseInt(id) }
      });

      if (!payment) {
        return ApiResponse.notFound(res, 'Paiement non trouvé');
      }

      // Vérifier que le paiement appartient à l'utilisateur
      if (payment.userId !== userId) {
        return ApiResponse.forbidden(res, 'Accès non autorisé');
      }

      // Si déjà réussi, retourner directement
      if (payment.status === 'COMPLETED') {
        const responseData = { status: 'COMPLETED', type: payment.type };
        if (payment.type === 'COIN_PURCHASE') {
          responseData.coins = payment.coins;
        } else if (payment.type === 'COURSE_PURCHASE') {
          const meta = payment.metadata ? JSON.parse(payment.metadata) : {};
          responseData.courseId = meta.courseId;
          responseData.courseTitle = meta.courseTitle;
        } else if (payment.type === 'VIDEO_PURCHASE') {
          const meta = payment.metadata ? JSON.parse(payment.metadata) : {};
          responseData.videoId = meta.videoId;
          responseData.videoTitle = meta.videoTitle;
        }
        return ApiResponse.success(res, responseData);
      }

      // Si pas de flouciPaymentId, impossible de vérifier
      if (!payment.flouciPaymentId) {
        return ApiResponse.success(res, {
          status: payment.status
        });
      }

      // Vérifier auprès de Flouci
      const flouciAppToken = process.env.FLOUCI_APP_TOKEN;

      try {
        const verifyResponse = await fetch(`https://developers.flouci.com/api/verify_payment/${payment.flouciPaymentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apppublic': flouciAppToken
          }
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.result?.status === 'SUCCESS') {
          const meta = payment.metadata ? JSON.parse(payment.metadata) : {};

          if (payment.type === 'COURSE_PURCHASE') {
            // Paiement cours réussi : inscrire l'utilisateur
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: { status: 'COMPLETED', completedAt: new Date() }
              });

              // Créer l'inscription au cours
              await tx.enrollment.create({
                data: {
                  userId,
                  courseId: meta.courseId,
                  status: 'ACTIVE',
                  enrolledAt: new Date()
                }
              });

              await tx.transaction.create({
                data: {
                  userId,
                  type: 'course_purchase_flouci',
                  amount: payment.amount,
                  coins: 0,
                  description: `Achat du cours: ${meta.courseTitle}`,
                  relatedId: payment.id
                }
              });
            });

            // Notification temps réel
            try {
              const io = req.app.get('io');
              const onlineUsers = req.app.get('onlineUsers');
              const sockId = onlineUsers?.get(userId);
              if (io && sockId) {
                io.to(sockId).emit('courseEnrolled', { courseId: meta.courseId });
              }
            } catch (e) {
              console.error('Socket notification error:', e);
            }

            // Notifier l'expert
            try {
              if (meta.expertId) {
                const expert = await prisma.expert.findUnique({ where: { id: meta.expertId }, select: { userId: true } });
                if (expert) {
                  await prisma.notification.create({
                    data: {
                      userId: expert.userId,
                      title: 'Nouvelle inscription payante',
                      message: `${req.user.firstName} ${req.user.lastName} s'est inscrit à votre cours "${meta.courseTitle}" via Flouci`,
                      type: 'course_enrollment',
                      actionUrl: `/dashboard/courses/${meta.courseId}/students`
                    }
                  });
                }
              }
            } catch (e) {
              console.error('Notification error:', e);
            }

            return ApiResponse.success(res, {
              status: 'COMPLETED',
              type: 'COURSE_PURCHASE',
              courseId: meta.courseId,
              courseTitle: meta.courseTitle
            }, 'Paiement confirmé, inscription au cours réussie');
          } else if (payment.type === 'VIDEO_PURCHASE') {
            // Paiement vidéo réussi : débloquer la vidéo
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: { status: 'COMPLETED', completedAt: new Date() }
              });

              // Vérifier si pas déjà débloquée
              const existing = await tx.userVideo.findUnique({
                where: { userId_videoId: { userId, videoId: meta.videoId } }
              });
              if (!existing) {
                await tx.userVideo.create({
                  data: { userId, videoId: meta.videoId, completed: false, watchTime: 0, liked: false }
                });
              }

              await tx.transaction.create({
                data: {
                  userId,
                  type: 'video_purchase_flouci',
                  amount: payment.amount,
                  coins: 0,
                  description: `Achat vidéo: ${meta.videoTitle}`,
                  relatedId: payment.id
                }
              });
            });

            try {
              const io = req.app.get('io');
              const onlineUsers = req.app.get('onlineUsers');
              const sockId = onlineUsers?.get(userId);
              if (io && sockId) {
                io.to(sockId).emit('videoUnlocked', { videoId: meta.videoId });
              }
            } catch (e) {
              console.error('Socket notification error:', e);
            }

            return ApiResponse.success(res, {
              status: 'COMPLETED',
              type: 'VIDEO_PURCHASE',
              videoId: meta.videoId,
              videoTitle: meta.videoTitle
            }, 'Paiement confirmé, vidéo débloquée');
          } else {
            // Paiement coins réussi : créditer les coins
            await prisma.$transaction(async (tx) => {
              await tx.user.update({
                where: { id: userId },
                data: { coins: { increment: payment.coins } }
              });

              await tx.payment.update({
                where: { id: payment.id },
                data: { status: 'COMPLETED', completedAt: new Date() }
              });

              await tx.transaction.create({
                data: {
                  userId,
                  type: 'coin_purchase_flouci',
                  amount: payment.amount,
                  coins: payment.coins,
                  description: `Achat de ${payment.coins} coins via Flouci`,
                  relatedId: payment.id
                }
              });
            });

            // Notification temps réel
            try {
              const io = req.app.get('io');
              const onlineUsers = req.app.get('onlineUsers');
              const sockId = onlineUsers?.get(userId);
              if (io && sockId) {
                io.to(sockId).emit('coinUpdate', { reason: 'purchase', coins: payment.coins });
              }
            } catch (e) {
              console.error('Socket notification error:', e);
            }

            return ApiResponse.success(res, {
              status: 'COMPLETED',
              type: 'COIN_PURCHASE',
              coins: payment.coins
            }, 'Paiement confirmé, coins crédités');
          }
        } else {
          // Toujours en attente ou échoué
          return ApiResponse.success(res, {
            status: verifyData.result?.status === 'PENDING' ? 'PENDING' : 'FAILED'
          });
        }
      } catch (fetchError) {
        console.error('Flouci verify error:', fetchError);
        return ApiResponse.error(res, 'Erreur lors de la vérification du paiement');
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      return ApiResponse.error(res, 'Erreur lors de la vérification du paiement');
    }
  }

  /**
   * PHASE 2 - Webhook Flouci pour notification de paiement
   * @route POST /api/payments/webhook/flouci
   * @access Public (but with signature verification)
   */
  static async handleFlouciWebhook(req, res) {
    try {
      const signature = req.headers['x-flouci-signature'];
      const payload = req.body;

      // Vérifier la signature HMAC-SHA256
      const flouciAppSecret = process.env.FLOUCI_APP_SECRET;

      if (!signature || !flouciAppSecret) {
        console.error('Missing signature or secret for webhook');
        return res.status(400).json({ error: 'Invalid request' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', flouciAppSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Traiter le webhook
      const { payment_id, status, developer_tracking_id } = payload;

      if (!developer_tracking_id || !developer_tracking_id.startsWith('PAYMENT_')) {
        console.error('Invalid developer_tracking_id:', developer_tracking_id);
        return res.status(400).json({ error: 'Invalid tracking ID' });
      }

      const paymentId = parseInt(developer_tracking_id.replace('PAYMENT_', ''));

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        console.error('Payment not found:', paymentId);
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Si paiement déjà traité, ignorer
      if (payment.status === 'COMPLETED') {
        return res.status(200).json({ message: 'Already processed' });
      }

      if (status === 'SUCCESS') {
        const meta = payment.metadata ? JSON.parse(payment.metadata) : {};

        if (payment.type === 'COURSE_PURCHASE') {
          // Inscription au cours via webhook
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED', completedAt: new Date(), flouciPaymentId: payment_id }
            });

            // Vérifier si pas déjà inscrit
            const existing = await tx.enrollment.findUnique({
              where: { userId_courseId: { userId: payment.userId, courseId: meta.courseId } }
            });
            if (!existing) {
              await tx.enrollment.create({
                data: {
                  userId: payment.userId,
                  courseId: meta.courseId,
                  status: 'ACTIVE',
                  enrolledAt: new Date()
                }
              });
            }

            await tx.transaction.create({
              data: {
                userId: payment.userId,
                type: 'course_purchase_flouci',
                amount: payment.amount,
                coins: 0,
                description: `Achat du cours: ${meta.courseTitle}`,
                relatedId: payment.id
              }
            });
          });

          try {
            const io = req.app.get('io');
            const onlineUsers = req.app.get('onlineUsers');
            const sockId = onlineUsers?.get(payment.userId);
            if (io && sockId) {
              io.to(sockId).emit('courseEnrolled', { courseId: meta.courseId });
            }
          } catch (e) {
            console.error('Socket notification error:', e);
          }
        } else if (payment.type === 'VIDEO_PURCHASE') {
          // Débloquer la vidéo via webhook
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED', completedAt: new Date(), flouciPaymentId: payment_id }
            });

            const existing = await tx.userVideo.findUnique({
              where: { userId_videoId: { userId: payment.userId, videoId: meta.videoId } }
            });
            if (!existing) {
              await tx.userVideo.create({
                data: { userId: payment.userId, videoId: meta.videoId, completed: false, watchTime: 0, liked: false }
              });
            }

            await tx.transaction.create({
              data: {
                userId: payment.userId,
                type: 'video_purchase_flouci',
                amount: payment.amount,
                coins: 0,
                description: `Achat vidéo: ${meta.videoTitle}`,
                relatedId: payment.id
              }
            });
          });

          try {
            const io = req.app.get('io');
            const onlineUsers = req.app.get('onlineUsers');
            const sockId = onlineUsers?.get(payment.userId);
            if (io && sockId) {
              io.to(sockId).emit('videoUnlocked', { videoId: meta.videoId });
            }
          } catch (e) {
            console.error('Socket notification error:', e);
          }
        } else {
          // Créditer les coins
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: payment.userId },
              data: { coins: { increment: payment.coins } }
            });

            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED', completedAt: new Date(), flouciPaymentId: payment_id }
            });

            await tx.transaction.create({
              data: {
                userId: payment.userId,
                type: 'coin_purchase_flouci',
                amount: payment.amount,
                coins: payment.coins,
                description: `Achat de ${payment.coins} coins via Flouci`,
                relatedId: payment.id
              }
            });
          });

          try {
            const io = req.app.get('io');
            const onlineUsers = req.app.get('onlineUsers');
            const sockId = onlineUsers?.get(payment.userId);
            if (io && sockId) {
              io.to(sockId).emit('coinUpdate', { reason: 'purchase', coins: payment.coins });
            }
          } catch (e) {
            console.error('Socket notification error:', e);
          }
        }

        console.log(`Payment ${payment.id} (${payment.type}) completed via webhook`);
        return res.status(200).json({ message: 'Payment processed' });
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: `Paiement ${String(status).toLowerCase()}`
          }
        });

        console.log(`Payment ${payment.id} failed via webhook:`, status);
        return res.status(200).json({ message: 'Payment failed' });
      }

      return res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
      console.error('Flouci webhook error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PHASE 2 - Acheter un cours via Flouci (paiement en TND)
   * @route POST /api/payments/buy-course
   * @access Private
   */
  static async buyCourse(req, res) {
    try {
      const { courseId } = req.body;
      const userId = req.user.id;

      if (!courseId) {
        return ApiResponse.badRequest(res, 'Vous devez sélectionner un cours');
      }

      // Vérifier que le cours existe et est publié
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          expertId: true,
          expert: { select: { name: true, userId: true } }
        }
      });

      if (!course) {
        return ApiResponse.notFound(res, 'Cours non trouvé');
      }

      if (course.status !== 'PUBLISHED') {
        return ApiResponse.badRequest(res, 'Ce cours n\'est pas disponible');
      }

      if (!course.price || parseFloat(course.price) <= 0) {
        return ApiResponse.badRequest(res, 'Ce cours est gratuit, pas besoin de paiement');
      }

      // Vérifier que l'utilisateur n'est pas déjà inscrit
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: parseInt(courseId) }
        }
      });

      if (existing) {
        return ApiResponse.badRequest(res, 'Vous êtes déjà inscrit à ce cours');
      }

      // Convertir TND en millimes (1 TND = 1000 millimes)
      const priceTND = parseFloat(course.price);
      const amountMillimes = Math.round(priceTND * 1000);

      // Créer le paiement en base (status PENDING)
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: amountMillimes,
          amountTND: priceTND,
          coins: 0,
          status: 'PENDING',
          paymentMethod: 'FLOUCI',
          type: 'COURSE_PURCHASE',
          metadata: JSON.stringify({
            courseId: course.id,
            courseTitle: course.title,
            expertId: course.expertId
          })
        }
      });

      // Préparer la requête Flouci
      const flouciAppToken = process.env.FLOUCI_APP_TOKEN;
      const flouciAppSecret = process.env.FLOUCI_APP_SECRET;

      if (!flouciAppToken || !flouciAppSecret) {
        console.error('Flouci credentials not configured');
        return ApiResponse.error(res, 'Configuration de paiement manquante');
      }

      const flouciPayload = {
        app_token: flouciAppToken,
        app_secret: flouciAppSecret,
        amount: amountMillimes,
        accept_card: true,
        session_timeout_secs: 1200,
        success_link: `${process.env.FRONTEND_URL}/payment/success?payment_id=${payment.id}`,
        fail_link: `${process.env.FRONTEND_URL}/payment/failed?payment_id=${payment.id}`,
        developer_tracking_id: `PAYMENT_${payment.id}`
      };

      try {
        const flouciResponse = await fetch('https://developers.flouci.com/api/generate_payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flouciPayload)
        });

        const flouciData = await flouciResponse.json();

        if (!flouciResponse.ok || !flouciData.result?.link) {
          console.error('Flouci API error:', flouciData);
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureReason: String(flouciData.error?.message || 'Erreur Flouci API').slice(0, 255)
            }
          });
          return ApiResponse.error(res, 'Erreur lors de la génération du lien de paiement');
        }

        // Sauvegarder les détails Flouci
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            flouciPaymentId: flouciData.result.payment_id || null,
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata),
              flouciPaymentId: flouciData.result.payment_id,
              flouciLink: flouciData.result.link
            })
          }
        });

        return ApiResponse.success(res, {
          paymentId: payment.id,
          flouciPaymentUrl: flouciData.result.link,
          amount: priceTND,
          courseTitle: course.title
        }, 'Lien de paiement généré');
      } catch (fetchError) {
        console.error('Flouci fetch error:', fetchError);
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: 'Erreur de connexion au service Flouci'
          }
        });
        return ApiResponse.error(res, 'Erreur de connexion au service de paiement');
      }
    } catch (error) {
      console.error('Buy course error:', error);
      return ApiResponse.error(res, 'Erreur lors de l\'achat du cours');
    }
  }

  /**
   * PHASE 2 - Récupérer l'historique de paiements de l'utilisateur
   * @route GET /api/payments/my
   * @access Private
   */
  static async getPaymentHistory(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { userId: req.user.id };
      if (status) {
        where.status = status;
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.payment.count({ where })
      ]);

      return ApiResponse.success(res, {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération de l\'historique');
    }
  }

  /**
   * PHASE 2 - Récupérer les packs de coins disponibles
   * @route GET /api/payments/coin-packs
   * @access Public
   */
  static async getCoinPacks(req, res) {
    try {
      const packs = await prisma.coinPack.findMany({
        where: { active: true },
        orderBy: { priceTND: 'asc' }
      });

      return ApiResponse.success(res, packs);
    } catch (error) {
      console.error('Get coin packs error:', error);
      return ApiResponse.error(res, 'Erreur lors de la récupération des packs');
    }
  }
}

module.exports = PaymentController;
