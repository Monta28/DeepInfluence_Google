'use client';

import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Toutes' },
    { id: 'general', name: 'Général' },
    { id: 'payment', name: 'Paiement' },
    { id: 'booking', name: 'Réservations' },
    { id: 'expert', name: 'Experts' },
  ];

  const faqs = [
    {
      category: 'general',
      question: 'Qu\'est-ce que DeepInfluence ?',
      answer: 'DeepInfluence est une plateforme qui met en relation des experts dans divers domaines avec des personnes cherchant des conseils personnalisés. Vous pouvez réserver des consultations, suivre des formations et accéder à des contenus exclusifs.',
    },
    {
      category: 'general',
      question: 'Comment fonctionne la plateforme ?',
      answer: 'Inscrivez-vous gratuitement, explorez les profils d\'experts, achetez des coins (notre monnaie virtuelle), puis réservez des consultations ou achetez des formations. Les consultations se font en ligne via notre système de visioconférence intégré.',
    },
    {
      category: 'payment',
      question: 'Qu\'est-ce que les "coins" ?',
      answer: 'Les coins sont notre monnaie virtuelle. 1 coin = 1€. Ils vous permettent de payer les consultations, formations et autres services sur la plateforme. Vous pouvez les acheter par packs avec parfois des bonus.',
    },
    {
      category: 'payment',
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, et les virements bancaires pour les packs supérieurs à 500€.',
    },
    {
      category: 'payment',
      question: 'Puis-je me faire rembourser mes coins ?',
      answer: 'Les coins achetés ne sont pas remboursables, mais ils n\'expirent jamais. Vous pouvez les utiliser à tout moment. En cas de consultation annulée par un expert, les coins vous sont automatiquement recrédités.',
    },
    {
      category: 'booking',
      question: 'Comment réserver une consultation ?',
      answer: 'Visitez le profil d\'un expert, consultez ses disponibilités, sélectionnez un créneau qui vous convient, et confirmez la réservation avec vos coins. Vous recevrez une confirmation par email avec le lien de visioconférence.',
    },
    {
      category: 'booking',
      question: 'Puis-je annuler ou modifier une réservation ?',
      answer: 'Vous pouvez annuler gratuitement jusqu\'à 24h avant la consultation. En cas d\'annulation plus tardive, 50% des coins sont retenus. Les modifications sont possibles selon les disponibilités de l\'expert.',
    },
    {
      category: 'booking',
      question: 'Que se passe-t-il si l\'expert ne se présente pas ?',
      answer: 'En cas d\'absence non justifiée de l\'expert, vous êtes intégralement remboursé en coins et recevez un bonus de 50 coins en compensation.',
    },
    {
      category: 'expert',
      question: 'Comment devenir expert sur DeepInfluence ?',
      answer: 'Créez un compte expert, complétez votre profil professionnel, soumettez vos diplômes et certifications. Notre équipe vérifie votre profil sous 48h. Une fois approuvé, vous pouvez commencer à proposer vos services.',
    },
    {
      category: 'expert',
      question: 'Combien prennent les experts ?',
      answer: 'Les tarifs varient selon l\'expert et sa spécialité. En moyenne, une consultation coûte entre 50 et 200 coins (50-200€). Les formations vont de 100 à 1000 coins selon la durée et le contenu.',
    },
    {
      category: 'expert',
      question: 'Les experts sont-ils vérifiés ?',
      answer: 'Oui, tous nos experts passent par un processus de vérification strict. Nous vérifions leurs diplômes, certifications, expérience professionnelle et antécédents. Les profils vérifiés portent un badge bleu.',
    },
    {
      category: 'general',
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Absolument. Nous utilisons un chiffrement SSL/TLS pour toutes les communications, vos données sont stockées sur des serveurs sécurisés conformes RGPD, et nous ne partageons jamais vos informations personnelles sans votre consentement.',
    },
    {
      category: 'general',
      question: 'Puis-je essayer avant d\'acheter ?',
      answer: 'Oui ! Vous recevez 50 coins gratuits à l\'inscription. De plus, de nombreux experts proposent des consultations découverte à prix réduit pour les nouveaux clients.',
    },
    {
      category: 'payment',
      question: 'Y a-t-il des frais cachés ?',
      answer: 'Non, aucun. Le prix affiché est le prix final. Les coins que vous achetez sont directement utilisables sans frais supplémentaires.',
    },
    {
      category: 'booking',
      question: 'Combien de temps dure une consultation ?',
      answer: 'La durée standard est de 60 minutes, mais certains experts proposent des sessions de 30 minutes ou des consultations longues de 90-120 minutes. La durée est toujours indiquée avant la réservation.',
    },
    {
      category: 'general',
      question: 'Puis-je changer d\'expert ?',
      answer: 'Bien sûr ! Vous êtes libre de consulter autant d\'experts différents que vous le souhaitez. Nous vous encourageons même à explorer plusieurs profils pour trouver l\'expert qui vous correspond le mieux.',
    },
  ];

  const filteredFAQs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 py-20 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-question-line text-6xl"></i>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Questions Fréquentes</h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Trouvez rapidement les réponses à vos questions
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Categories */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <i className={`ri-arrow-${openIndex === index ? 'up' : 'down'}-s-line text-2xl text-purple-600 flex-shrink-0`}></i>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-16 text-center bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vous ne trouvez pas votre réponse ?</h2>
            <p className="text-gray-600 mb-6">Notre équipe support est disponible 24/7 pour vous aider</p>
            <a
              href="/aide"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <i className="ri-customer-service-2-line"></i>
              Contacter le support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
