const prisma = require('../../services/database');
const ApiResponse = require('../../utils/response');
const NodeCache = require('node-cache');

// أنشئ ذاكرة تخزين مؤقت بصلاحية 5 دقائق (300 ثانية)
const statsCache = new NodeCache({ stdTTL: 300 });

class StatsController {
    static async getPublicStats(req, res) {
        try {
            // 1. تحقق أولاً من وجود البيانات في الـ Cache
            const cachedStats = statsCache.get('publicStats');
            if (cachedStats) {
                console.log("📊 Servin' stats from CACHE");
                return ApiResponse.success(res, cachedStats);
            }

            console.log("📊 Calculatin' fresh stats from DB");
            // 2. إذا لم تكن موجودة، قم بحسابها من قاعدة البيانات
            const [totalExperts, totalUsers, totalFormations, totalVideos, totalReviews, expertCategories] = await prisma.$transaction([
                prisma.expert.count({ where: { verified: true } }),
                prisma.user.count({ where: { userType: 'user' } }),
                prisma.formation.count(),
                prisma.video.count(),
                prisma.review.aggregate({ _avg: { rating: true } }),
                prisma.expert.findMany({ where: { verified: true }, select: { category: true }, distinct: ['category'] })
            ]);

            //const videoStats = await prisma.video.aggregate({ _sum: { views: true, duration: true } });
            const videoStats = await prisma.video.aggregate({ _sum: { views: true } });
            const formationStats = await prisma.formation.aggregate({ _sum: { students: true } });
            const certificatesIssuedCount = await prisma.userFormation.count({where: { certificateIssued: true }});


            const stats = {
                totalExperts: totalExperts || 0,
                happyClients: totalUsers || 0,
                successRate: totalReviews._avg.rating ? Math.round(parseFloat(totalReviews._avg.rating.toFixed(1)) * 20) : 95,
                totalFormations: totalFormations || 0,
                totalVideos: totalVideos || 0,
                totalViews: videoStats._sum.views || 0,
                totalHoursContent: Math.round((videoStats._sum.duration || 0) / 3600),
                certificatesIssued: certificatesIssuedCount || 0, // Placeholder
                totalStudents: formationStats._sum.students || 0,
                totalCategories: expertCategories.length || 0
            };

            // 3. قم بتخزين النتيجة الجديدة في الـ Cache قبل إرسالها
            statsCache.set('publicStats', stats);

            return ApiResponse.success(res, stats);
        } catch (error) {
            console.error('Get public stats error:', error.message, error.stack);
            return ApiResponse.error(res, 'Erreur lors de la récupération des statistiques publiques');
        }
    }
}

module.exports = StatsController;