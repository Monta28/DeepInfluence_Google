import Link from 'next/link';
import { useCurrency } from '../contexts/CurrencyContext';

interface Course {
  id: number;
  title: string;
  description?: string;
  thumbnail: string;
  level: string;
  category: string;
  price: number;
  certificateEnabled?: boolean;
  isPublished?: boolean;
  expert?: {
    id: number;
    name: string;
    profilePicture?: string;
    verified?: boolean;
  };
  _count?: {
    enrollments?: number;
    modules?: number;
  };
  isOwner?: boolean;
  isEnrolled?: boolean;
  progress?: number;
  completed?: boolean;
}

interface CourseCardProps {
  course: Course;
  ownerActions?: boolean;
}

export default function CourseCard({ course, ownerActions = false }: CourseCardProps) {
  const { formatPrice } = useCurrency();
  const expertName = course.expert?.name || 'Expert';
  const expertAvatar = course.expert?.profilePicture || '/default-avatar.png';
  const expertVerified = Boolean(course.expert?.verified);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image */}
      <Link href={`/courses/${course.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={course.thumbnail || '/default-course.jpg'}
            alt={course.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {ownerActions && course.isOwner && (
            <div className="absolute top-2 right-2">
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                Propriétaire
              </span>
            </div>
          )}
          {!ownerActions && course.isEnrolled && (
            <div className="absolute top-2 right-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                Inscrit
              </span>
            </div>
          )}
          {course.isPublished === false && (
            <div className="absolute top-2 left-2">
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                Brouillon
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-6">
        {/* Category & Level */}
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs px-2 py-1 rounded-full font-medium">
            {course.category}
          </span>
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
            {course.level}
          </span>
        </div>

        {/* Title */}
        <Link href={`/courses/${course.id}`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 cursor-pointer">
            {course.title}
          </h3>
        </Link>

        {/* Description */}
        {course.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Expert Info */}
        <div className="flex items-center gap-2 mb-4">
          <img
            src={expertAvatar}
            alt={expertName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {expertName}
            </span>
            {expertVerified && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {!ownerActions && course.isEnrolled && typeof course.progress === 'number' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progression</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {course.progress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
          {course._count?.modules !== undefined && (
            <div className="flex items-center gap-1">
              <i className="ri-book-2-line"></i>
              <span>{course._count.modules} modules</span>
            </div>
          )}
          {ownerActions && course._count?.enrollments !== undefined && (
            <div className="flex items-center gap-1">
              <i className="ri-user-line"></i>
              <span>{course._count.enrollments} inscrits</span>
            </div>
          )}
          {course.certificateEnabled && (
            <div className="flex items-center gap-1">
              <i className="ri-award-line text-yellow-600"></i>
              <span>Certificat</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
          {ownerActions ? (
            <>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(course.price)}
              </span>
              <Link
                href={`/dashboard/courses/${course.id}/edit`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                Gérer
              </Link>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(course.price)}
              </span>
              <Link
                href={`/courses/${course.id}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                {course.isEnrolled ? 'Continuer' : 'Voir'}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
