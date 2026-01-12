const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');

class FavoritesController {
  static async listExperts(req, res) {
    try {
      const rows = await prisma.favoriteExpert.findMany({
        where: { userId: req.user.id },
        include: { expert: { include: { user: { select: { avatar: true } } } } },
        orderBy: { createdAt: 'desc' }
      });
      const experts = rows.map(r => ({ ...r.expert, image: r.expert.user?.avatar }));
      return ApiResponse.success(res, { experts });
    } catch (e) {
      console.error('List favorite experts error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des favoris');
    }
  }

  static async listFormations(req, res) {
    try {
      const rows = await prisma.favoriteFormation.findMany({
        where: { userId: req.user.id },
        include: { formation: { include: { expert: { include: { user: { select: { avatar: true } } } } } } },
        orderBy: { createdAt: 'desc' }
      });
      const safe = (s, fb) => { try { if (!s) return fb; return JSON.parse(s); } catch { return fb; } };
      const formations = rows.map(r => {
        const f = r.formation;
        const expert = f.expert;
        return {
          ...f,
          tags: safe(f.tags, []),
          modules: safe(f.modules, []),
          expert: expert ? { id: expert.id, name: expert.name, verified: expert.verified, image: expert.user?.avatar } : null
        };
      });
      return ApiResponse.success(res, { formations });
    } catch (e) {
      console.error('List favorite formations error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des favoris');
    }
  }

  static async toggleExpert(req, res) {
    try {
      const expertId = parseInt(req.params.id);
      const existing = await prisma.favoriteExpert.findUnique({ where: { userId_expertId: { userId: req.user.id, expertId } } });
      if (existing) {
        await prisma.favoriteExpert.delete({ where: { userId_expertId: { userId: req.user.id, expertId } } });
        return ApiResponse.success(res, { favorited: false }, 'Retiré des favoris');
      }
      await prisma.favoriteExpert.create({ data: { userId: req.user.id, expertId } });
      return ApiResponse.success(res, { favorited: true }, 'Ajouté aux favoris');
    } catch (e) {
      console.error('Toggle favorite expert error:', e);
      return ApiResponse.error(res, 'Erreur de mise à jour des favoris');
    }
  }

  static async toggleFormation(req, res) {
    try {
      const formationId = parseInt(req.params.id);
      const existing = await prisma.favoriteFormation.findUnique({ where: { userId_formationId: { userId: req.user.id, formationId } } });
      if (existing) {
        await prisma.favoriteFormation.delete({ where: { userId_formationId: { userId: req.user.id, formationId } } });
        return ApiResponse.success(res, { favorited: false }, 'Retiré des favoris');
      }
      await prisma.favoriteFormation.create({ data: { userId: req.user.id, formationId } });
      return ApiResponse.success(res, { favorited: true }, 'Ajouté aux favoris');
    } catch (e) {
      console.error('Toggle favorite formation error:', e);
      return ApiResponse.error(res, 'Erreur de mise à jour des favoris');
    }
  }


  static async listVideos(req, res) {
    try {
      const rows = await prisma.favoriteVideo.findMany({
        where: { userId: req.user.id },
        include: { video: true },
        orderBy: { createdAt: 'desc' }
      });
      const videos = rows.map(r => ({ ...r.video, isUnlocked: true }));
      return ApiResponse.success(res, { videos });
    } catch (e) {
      console.error('List favorite videos error:', e);
      return ApiResponse.error(res, 'Erreur lors de la récupération des vidéos favoris');
    }
  }

  static async toggleVideo(req, res) {
    try {
      const videoId = parseInt(req.params.id);
      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (!video) return ApiResponse.notFound(res, 'Vidéo non trouvée');
      const existing = await prisma.favoriteVideo.findUnique({ where: { userId_videoId: { userId: req.user.id, videoId } } });
      if (existing) {
        await prisma.favoriteVideo.delete({ where: { userId_videoId: { userId: req.user.id, videoId } } });
        return ApiResponse.success(res, { favorited: false }, 'Retirée des favoris');
      }
      await prisma.favoriteVideo.create({ data: { userId: req.user.id, videoId } });
      return ApiResponse.success(res, { favorited: true }, 'Ajoutée aux favoris');
    } catch (e) {
      console.error('Toggle favorite video error:', e);
      return ApiResponse.error(res, 'Erreur de mise à jour des favoris vidéo');
    }
  }
}

module.exports = FavoritesController;
