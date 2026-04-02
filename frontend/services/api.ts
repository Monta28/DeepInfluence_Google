const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types
export interface SimpleUser {
  avatar?: string;
  firstName?: string;
  lastName?: string;
  joinDate?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  coins: number;
  isVerified: boolean;
  joinDate: string;
  expert?: Expert;
  avatar?: string;
  phone?: string;
  bio?: string;
  location?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Expert {
  id: number;
  userId: number;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  pricePerMessage: number;
  image?: string;
  isOnline: boolean;
  nextAvailable?: string;
  tags: string[];
  verified: boolean;
  isVerified?: boolean; // Alias for verified
  category: string;
  languages: string[];
  responseTime?: string;
  sessions: number;
  followers: number;
  description?: string;
  user?: SimpleUser;
  formations?: any[];
  videos?: any[];
  isFollowed?: boolean;
  verificationStatus?: string;
  reviewList?: Review[];
}

export interface Formation {
  id: number;
  title: string;
  instructor: string;
  duration: string;
  level: string;
  rating: number;
  students: number;
  price: number;
  type: string;
  maxPlaces: number;
  currentPlaces: number;
  location: string;
  image?: string;
  tags: string[];
  nextSession?: string;
  description: string;
  schedule?: string;
  modules: string[];
  category: string;
  // Champs additionnels potentiels
  language?: string;
  certificate?: boolean;
  support?: string;
  accessDuration?: string;
  objectives?: string[];
  prerequisites?: string[];
  included?: string[];
  tools?: string[];
  expert?: { id: number; name: string; verified: boolean; image?: string } | null;
  reviews?: Review[];
  isEnrolled?: boolean;
  progress?: number;
  completed?: boolean;
}

export interface Video {
  id: number;
  title: string;
  instructor?: string;
  expert?: string;
  duration: number | string;
  views: number | string;
  likes: number;
  category: string;
  isPremium?: boolean;
  type?: string;
  price?: number;
  thumbnail?: string;
  description?: string;
  publishedAt?: string;
  isUnlocked?: boolean;
  expertImage?: string;
  avatar?: string;
  isLiked?: boolean;
}

export interface PublicStats {
  totalExperts: number;
  happyClients: number | string;
  successRate: number;
  totalFormations?: number;
  totalVideos?: number;
  totalViews?: number;
  totalHoursContent?: number;
  certificatesIssued?: number;
  totalStudents?: number;
  totalCategories?: number;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

// Utilitaire pour les requêtes API
class ApiService {
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || 'Erreur API');
    }
    return response.json();
  }

  private static toMergedHeaders(...headersList: Array<HeadersInit | undefined>): Record<string, string> {
    const merged: Record<string, string> = {};

    const appendHeaders = (headers?: HeadersInit) => {
      if (!headers) return;

      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          merged[key] = value;
        });
        return;
      }

      if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
          merged[key] = value;
        });
        return;
      }

      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
          merged[key] = String(value);
        }
      });
    };

    headersList.forEach(appendHeaders);
    return merged;
  }

  private static buildUrl(endpoint: string, params?: Record<string, any>): string {
    const base = API_BASE_URL.replace(/\/$/, '');
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${base}${normalizedEndpoint}`;

    if (!params) return url;

    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, String(value));
      }
    });

    const query = search.toString();
    if (!query) return url;
    return `${url}${url.includes('?') ? '&' : '?'}${query}`;
  }

  // Axios-like compatibility helpers for legacy pages
  static async get(endpoint: string, config?: { params?: Record<string, any>; headers?: HeadersInit; cache?: RequestCache }) {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.toMergedHeaders(this.getAuthHeaders(), config?.headers);
    const response = await fetch(url, {
      method: 'GET',
      headers,
      ...(config?.cache ? { cache: config.cache } : {})
    });
    return { data: await this.handleResponse(response) };
  }

  static async post(endpoint: string, data?: any, config?: { params?: Record<string, any>; headers?: HeadersInit }) {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.toMergedHeaders(this.getAuthHeaders(), config?.headers);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data ?? {})
    });
    return { data: await this.handleResponse(response) };
  }

  static async put(endpoint: string, data?: any, config?: { params?: Record<string, any>; headers?: HeadersInit }) {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.toMergedHeaders(this.getAuthHeaders(), config?.headers);
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data ?? {})
    });
    return { data: await this.handleResponse(response) };
  }

  static async delete(endpoint: string, config?: { params?: Record<string, any>; headers?: HeadersInit }) {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.toMergedHeaders(this.getAuthHeaders(), config?.headers);
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    return { data: await this.handleResponse(response) };
  }

  // Authentification
  static async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return this.handleResponse(response);
  }

  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType?: string;
    referralCode?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

  static async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return this.handleResponse(response);
  }

  static async resetPassword(token: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    return this.handleResponse(response);
  }

  // Referral system
  static async generateReferralCode() {
    const response = await fetch(`${API_BASE_URL}/referrals/generate-code`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getReferralStats() {
    const response = await fetch(`${API_BASE_URL}/referrals/stats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getMyReferrals() {
    const response = await fetch(`${API_BASE_URL}/referrals/my-referrals`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Formation CRUD
  static async updateFormation(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/formations/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  static async deleteFormation(id: number) {
    const response = await fetch(`${API_BASE_URL}/formations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getMe() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Coins & Transactions
  static async getCoins() {
    const response = await fetch(`${API_BASE_URL}/users/coins`, {
      headers: this.getAuthHeaders(),
      cache: 'no-store'
    });
    return this.handleResponse(response);
  }

  static async getTransactions(params?: { limit?: number }) {
    const search = new URLSearchParams();
    if (params?.limit) search.append('limit', String(params.limit));
    const response = await fetch(`${API_BASE_URL}/users/transactions?${search}`, {
      headers: this.getAuthHeaders(),
      cache: 'no-store'
    });
    return this.handleResponse(response);
  }

  static async purchaseCoins(payload: { coins: number; bonus?: number; priceMillimes?: number; packageId?: number }) {
    const response = await fetch(`${API_BASE_URL}/users/coins/purchase`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  static async transferCoins(payload: { coins: number; cardNumber?: string; expiryDate?: string; cvv?: string; cardName?: string }) {
    const response = await fetch(`${API_BASE_URL}/users/coins/transfer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  // Experts
  static async getExperts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/experts?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getExpert(id: number) {
    const response = await fetch(`${API_BASE_URL}/experts/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Follow / Following
  static async toggleFollowExpert(id: number) {
    const response = await fetch(`${API_BASE_URL}/experts/${id}/follow`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getFollowingExperts() {
    const response = await fetch(`${API_BASE_URL}/experts/following`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Expert Availability
  static async getMyAvailability(): Promise<{ success: boolean, data?: { availableDays: number[], availableTimeSlots: { start: string, end: string }[], vacationDays: string[], appointmentInterval: number }, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/experts/availability`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async updateMyAvailability(availability: { availableDays?: number[], availableTimeSlots?: { start: string, end: string }[], vacationDays?: string[], appointmentInterval?: number }): Promise<{ success: boolean, data?: any, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/experts/availability`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(availability)
    });
    return this.handleResponse(response);
  }

  static async getExpertAvailability(expertId: number): Promise<{ success: boolean, data?: { availableDays: number[], availableTimeSlots: { start: string, end: string }[], vacationDays: string[], appointmentInterval: number, timeSlots: string[] }, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/experts/${expertId}/availability`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Formations
  static async getFormations(params?: {
    category?: string;
    level?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/formations?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getExpertFormations(params?: { limit?: number }) {
    
    const searchParams = new URLSearchParams();
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    const response = await fetch(`${API_BASE_URL}/formations/my?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getEnrolledFormations() {
    const response = await fetch(`${API_BASE_URL}/formations/enrollments`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getFormationById(id: number) {
    const response = await fetch(`${API_BASE_URL}/formations/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
  
  static async createFormation(payload: {
    title: string;
    duration: string;
    level: string;
    price: number | string;
    type: string;
    maxPlaces: number | string;
    location?: string;
    image?: string;
    tags?: string[];
    nextSession?: string;
    description?: string;
    schedule?: string;
    modules?: string[];
    category: string;
    objectives?: string[];
    prerequisites?: string[];
    included?: string[];
    tools?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/formations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  static async enrollInFormation(id: number) {
    const response = await fetch(`${API_BASE_URL}/formations/${id}/enroll`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Vidéos
  static async getVideos(params?: {
    category?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/videos?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getExpertVideos(params?: { limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    const response = await fetch(`${API_BASE_URL}/videos/my?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getMyExpert() {
    const response = await fetch(`${API_BASE_URL}/experts/me`, {
      headers: this.getAuthHeaders(),
      cache: 'no-store'
    });
    return this.handleResponse(response);
  }

  static async getExpertAnalytics() {
    const response = await fetch(`${API_BASE_URL}/experts/stats/analytics`, {
      headers: this.getAuthHeaders(),
      cache: 'no-store'
    });
    return this.handleResponse(response);
  }

  static async getExpertTopContent() {
    const response = await fetch(`${API_BASE_URL}/experts/stats/top`, {
      headers: this.getAuthHeaders(),
      cache: 'no-store'
    });
    return this.handleResponse(response);
  }

  static async getMyUnlockedVideos() {
    const response = await fetch(`${API_BASE_URL}/videos/unlocked`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Favorites
  static async getFavoriteExperts() {
    const response = await fetch(`${API_BASE_URL}/favorites/experts`, { headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }
  static async getFavoriteFormations() {
    const response = await fetch(`${API_BASE_URL}/favorites/formations`, { headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }
  static async toggleFavoriteExpert(id: number) {
    const response = await fetch(`${API_BASE_URL}/favorites/experts/${id}`, { method: 'POST', headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }
  static async toggleFavoriteFormation(id: number) {
    const response = await fetch(`${API_BASE_URL}/favorites/formations/${id}`, { method: 'POST', headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }

  static async getVideoById(id: number) {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async purchaseVideo(id: number) {
    const response = await fetch(`${API_BASE_URL}/videos/${id}/purchase`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
  static async createVideo(payload: {
    title: string;
    duration: string | number;
    type?: 'free' | 'premium';
    videoType?: 'NORMAL' | 'REEL';
    accessType?: 'FREE' | 'PAID';
    orientation?: 'LANDSCAPE' | 'PORTRAIT';
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    price?: number | string;
    category: string;
    thumbnail?: string;
    description: string;
    videoUrl?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  static async likeVideo(id: number) {
    const response = await fetch(`${API_BASE_URL}/videos/${id}/like`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getFavoriteVideos() {
    const response = await fetch(`${API_BASE_URL}/favorites/videos`, { headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }

  static async toggleFavoriteVideo(id: number) {
    const response = await fetch(`${API_BASE_URL}/favorites/videos/${id}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Rendez-vous
  static async getAppointments(status?: string) {
    const searchParams = new URLSearchParams();
    if (status) {
      searchParams.append('status', status);
    }
    
    const response = await fetch(`${API_BASE_URL}/appointments?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getExpertAppointments(): Promise<{ success: boolean, data?: any[], message?: string }> {
    const response = await fetch(`${API_BASE_URL}/appointments/expert`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async confirmAppointment(id: number): Promise<{ success: boolean, data?: any, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/confirm`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async cancelAppointment(id: number): Promise<{ success: boolean, data?: any, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async completeAppointment(id: number): Promise<{ success: boolean, data?: any, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/complete`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Notifications
  static async getNotifications(limit = 20): Promise<{ success: boolean, data?: { items: any[]; unread: number }, message?: string }> {
    const params = new URLSearchParams({ limit: String(limit) });
    const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async markNotificationRead(id: number): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
  static async getOccupiedSlots(expertId: number, date: string): Promise<{ success: boolean, data?: string[], message?: string }> {
    const params = new URLSearchParams({ expertId: String(expertId), date });
    const response = await fetch(`${API_BASE_URL}/appointments/occupied?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async createAppointment(appointmentData: {
    expertId: number;
    type: string;
    date: string;
    time: string;
    duration: string;
    category: string;
    formationId?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return this.handleResponse(response);
  }

  // Profil utilisateur
  static async getUserProfile() {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async updateUserProfile(profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    location?: string;
    avatar?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  static async getUserStats() {
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Administration
  static async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/users?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Satistiques publiques
  static async getPublicStats(): Promise<{ success: boolean, data?: PublicStats, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/stats/public`, { // URL corrigée
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Témoignages
  static async getFeaturedReviews(): Promise<{ success: boolean, data?: Testimonial[], message?: string }> {
    const response = await fetch(`${API_BASE_URL}/reviews/featured`);
    return this.handleResponse(response);
  }
  
  static async createReview(reviewData: {
    expertId: number;
    rating: number;
    comment: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    return this.handleResponse(response);
  }

  // Messages
  static async toggleConversationFree(conversationId: number): Promise<{ success: boolean, data?: any, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/toggle-free`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  static async initiateConversation(receiverId: number, content: string) {
    const response = await fetch(`${API_BASE_URL}/messages/initiate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ receiverId, content, message: content }) // accepte toutes les variantes
    });
    return this.handleResponse(response);
  }

  static async getConversations(): Promise<{ success: boolean, data?: any[], message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  } 

  static async getMessages(conversationId: number): Promise<{ success: boolean, data?: any[], message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async sendMessage(conversationId: number, receiverId: number, content: string, extra?: { messageType?: string; attachmentUrl?: string; attachmentName?: string; attachmentSize?: number; duration?: number }): Promise<{ success: boolean, data?: any, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content, receiverId, ...extra }),
    });
    return this.handleResponse(response);
  }

  static async deleteMessage(messageId: number): Promise<{ success: boolean, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }   

  static async deleteConversation(conversationId: number): Promise<{ success: boolean, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  } 

  static async markMessageAsRead(messageId: number): Promise<{ success: boolean, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  static async markAllMessagesAsRead(conversationId: number): Promise<{ success: boolean, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/messages/${conversationId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Téléchargement d'avatar
  static async uploadAvatar(file: File): Promise<{ success: boolean, data?: { url: string }, message?: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  // Vérification de l'expert
  static async submitVerification(formData: FormData): Promise<{ success: boolean, message?: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/experts/submit-verification`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
        // Pas de 'Content-Type', le navigateur le définit pour FormData
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  // Dashboard pour les experts
  static async getExpertDashboardStats(): Promise<{ success: boolean, data?: any, message?: string }> {
    const response = await fetch(`${API_BASE_URL}/experts/stats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // --- Admin ---
  static async adminOverview() {
    const response = await fetch(`${API_BASE_URL}/admin/overview`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminListExperts(params?: { status?: 'all'|'pending'|'verified'; search?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const response = await fetch(`${API_BASE_URL}/admin/experts?${sp.toString()}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminVerifyExpert(id: number, action: 'approve'|'reject', reason?: string) {
    const response = await fetch(`${API_BASE_URL}/admin/experts/${id}/verify`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ action, reason })
    });
    return this.handleResponse(response);
  }

  static async adminListUsers(params?: { query?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.query) sp.append('query', params.query);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const response = await fetch(`${API_BASE_URL}/admin/users?${sp.toString()}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminListReviews(params?: { search?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const response = await fetch(`${API_BASE_URL}/admin/reviews?${sp.toString()}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminDeleteReview(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
  static async adminBulkDeleteReviews(ids: number[]) {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/bulk-delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ids })
    });
    return this.handleResponse(response);
  }
  // Content lists
  static async adminListVideos(params?: { search?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const response = await fetch(`${API_BASE_URL}/admin/videos?${sp.toString()}`, { headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }
  static async adminDeleteVideo(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/videos/${id}`, { method: 'DELETE', headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }
  static async adminListFormations(params?: { search?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const response = await fetch(`${API_BASE_URL}/admin/formations?${sp.toString()}`, { headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }
  static async adminDeleteFormation(id: number) {
    const response = await fetch(`${API_BASE_URL}/admin/formations/${id}`, { method: 'DELETE', headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }

  static async adminSetUserBanned(id: number, banned: boolean) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}/ban`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ banned })
    });
    return this.handleResponse(response);
  }

  static async adminSetUserRole(id: number, userType: 'user'|'expert'|'admin') {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userType })
    });
    return this.handleResponse(response);
  }

  static async adminListAppointments(params?: { status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const response = await fetch(`${API_BASE_URL}/admin/appointments?${sp.toString()}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminUpdateAppointment(id: number, action: 'confirm'|'cancel'|'complete') {
    const response = await fetch(`${API_BASE_URL}/admin/appointments/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ action })
    });
    return this.handleResponse(response);
  }

  static async adminTrends(days: number = 7) {
    const response = await fetch(`${API_BASE_URL}/admin/metrics/trends?days=${days}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminBroadcast(payload: { target: 'all'|'users'|'experts'; title: string; message: string; actionUrl?: string }) {
    const response = await fetch(`${API_BASE_URL}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  // Settings (Currency)
  static async getCurrency() {
    const response = await fetch(`${API_BASE_URL}/settings/currency`);
    return this.handleResponse(response);
  }

  static async updateCurrency(currencyData: { code: string; symbol: string; name: string; position: 'before' | 'after' }) {
    const response = await fetch(`${API_BASE_URL}/settings/currency`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(currencyData)
    });
    return this.handleResponse(response);
  }

  static async getAllSettings() {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Admin Transactions
  static async adminListTransactions(params?: { page?: number; limit?: number; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);

    const response = await fetch(`${API_BASE_URL}/admin/transactions?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminAddCoins(userId: number, coins: number) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/coins`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ coins })
    });
    return this.handleResponse(response);
  }

  // ==========================================
  // PHASE 2 - NOUVELLES FONCTIONNALITÉS
  // ==========================================

  // Admin Payouts
  static async adminListPayouts(params?: { status?: string; period?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.period) searchParams.append('period', params.period);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/admin/payouts?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminProcessPayout(payoutId: number, data: { notes?: string }) {
    const response = await fetch(`${API_BASE_URL}/admin/payouts/${payoutId}/process`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // Expert Schedule Exceptions
  static async createScheduleException(data: { date: string; type: string; customSlots?: any; reason?: string }) {
    const response = await fetch(`${API_BASE_URL}/experts/schedule-exception`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  static async listScheduleExceptions(params?: { startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const query = searchParams.toString();
    const url = query
      ? `${API_BASE_URL}/experts/schedule-exceptions?${query}`
      : `${API_BASE_URL}/experts/schedule-exceptions`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async deleteScheduleException(exceptionId: number) {
    const response = await fetch(`${API_BASE_URL}/experts/schedule-exception/${exceptionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Quiz Submission
  static async submitQuiz(lessonId: number, answers: Record<string, string[]>) {
    const response = await fetch(`${API_BASE_URL}/courses/lessons/${lessonId}/quiz-submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ answers })
    });
    return this.handleResponse(response);
  }

  // Enrollments
  static async getMyEnrollments(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    const url = query
      ? `${API_BASE_URL}/courses/enrollments/my?${query}`
      : `${API_BASE_URL}/courses/enrollments/my`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Certificate Generation
  static async generateCertificate(courseId: number) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/certificate`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ==========================================
  // COURSES (PHASE 2)
  // ==========================================

  // Create Course (Expert only)
  static async createCourse(data: any) {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // Get Expert's Courses
  static async getExpertCourses(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = query
      ? `${API_BASE_URL}/courses/my?${query}`
      : `${API_BASE_URL}/courses/my`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Get Enrolled Courses
  static async getEnrolledCourses(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    const url = query
      ? `${API_BASE_URL}/courses/enrollments/my?${query}`
      : `${API_BASE_URL}/courses/enrollments/my`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Update Course
  static async updateCourse(courseId: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // Delete Course
  static async deleteCourse(courseId: number) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Get Single Course
  static async getCourse(courseId: number) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Enroll in a Course
  static async enrollInCourse(courseId: number) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Get All Courses (Public)
  static async getCourses(params?: { category?: string; level?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.level) searchParams.append('level', params.level);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = query
      ? `${API_BASE_URL}/courses?${query}`
      : `${API_BASE_URL}/courses`;

    const response = await fetch(url);
    return this.handleResponse(response);
  }

  // Upload Video File
  static async uploadVideo(file: File): Promise<{ success: boolean, data?: { url: string; filename: string; size: number }, message?: string }> {
    const formData = new FormData();
    formData.append('video', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/upload/video`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  // Upload Thumbnail
  static async uploadThumbnail(file: File): Promise<{ success: boolean, data?: { url: string }, message?: string }> {
    const formData = new FormData();
    formData.append('thumbnail', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/upload/thumbnail`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  // Chat attachment upload
  static async uploadChatAttachment(file: File): Promise<{ success: boolean, data?: { url: string; filename: string; size: number; mimetype: string }, message?: string }> {
    const formData = new FormData();
    formData.append('attachment', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/upload/chat-attachment`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData
    });
    return this.handleResponse(response);
  }

  // Admin Verifications (KYC)
  static async adminListVerifications(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/admin/verifications?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminGetVerification(expertId: number) {
    const response = await fetch(`${API_BASE_URL}/admin/verifications/${expertId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async adminReviewVerification(expertId: number, data: { decision: string; rejectionReason?: string; notes?: string }) {
    const response = await fetch(`${API_BASE_URL}/admin/verifications/${expertId}/review`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // Coin Packs
  static async getCoinPacks() {
    const response = await fetch(`${API_BASE_URL}/payments/coin-packs`);
    return this.handleResponse(response);
  }

  // Buy Coins via Flouci
  static async buyCoinPack(coinPackId: number) {
    const response = await fetch(`${API_BASE_URL}/payments/buy-coins`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ coinPackId })
    });
    return this.handleResponse(response);
  }

  // Buy Course via Flouci (TND direct payment)
  static async buyCourse(courseId: number) {
    const response = await fetch(`${API_BASE_URL}/payments/buy-course`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ courseId })
    });
    return this.handleResponse(response);
  }

  // Buy Video via Flouci (TND direct payment)
  static async buyVideo(videoId: number) {
    const response = await fetch(`${API_BASE_URL}/payments/buy-video`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ videoId })
    });
    return this.handleResponse(response);
  }

  // Verify Payment
  static async verifyPayment(paymentId: number) {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Course Progress
  static async getCourseProgress(courseId: number) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Mark Lesson Complete
  static async markLessonComplete(lessonId: number) {
    const response = await fetch(`${API_BASE_URL}/courses/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Leave Course
  static async leaveCourse(courseId: number) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/leave`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Video Comments
  static async addVideoComment(videoId: number, content: string) {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comment`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content })
    });
    return this.handleResponse(response);
  }

  static async getVideoComments(videoId: number, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments?${searchParams}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Track Video View
  static async trackVideoView(videoId: number) {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/view`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

}

export default ApiService;

// Named exports for convenience
export const adminListPayouts = ApiService.adminListPayouts.bind(ApiService);
export const adminProcessPayout = ApiService.adminProcessPayout.bind(ApiService);
export const createScheduleException = ApiService.createScheduleException.bind(ApiService);
export const listScheduleExceptions = ApiService.listScheduleExceptions.bind(ApiService);
export const deleteScheduleException = ApiService.deleteScheduleException.bind(ApiService);
export const submitQuiz = ApiService.submitQuiz.bind(ApiService);
export const getMyEnrollments = ApiService.getMyEnrollments.bind(ApiService);
export const generateCertificate = ApiService.generateCertificate.bind(ApiService);
export const uploadVideo = ApiService.uploadVideo.bind(ApiService);
export const uploadThumbnail = ApiService.uploadThumbnail.bind(ApiService);
export const getCoinPacks = ApiService.getCoinPacks.bind(ApiService);
export const buyCoinPack = ApiService.buyCoinPack.bind(ApiService);
export const buyCourse = ApiService.buyCourse.bind(ApiService);
export const buyVideo = ApiService.buyVideo.bind(ApiService);
export const verifyPayment = ApiService.verifyPayment.bind(ApiService);
export const getCourseProgress = ApiService.getCourseProgress.bind(ApiService);
export const markLessonComplete = ApiService.markLessonComplete.bind(ApiService);
export const addVideoComment = ApiService.addVideoComment.bind(ApiService);
export const getVideoComments = ApiService.getVideoComments.bind(ApiService);
export const trackVideoView = ApiService.trackVideoView.bind(ApiService);
