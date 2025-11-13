'use client'

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldCheck,
  MessageCircle,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LineChart,
  Users,
  UploadCloud,
  Bot,
  BarChart3,
  ArrowUpRight,
  Lock,
  Clock,
  BookOpen,
  Zap,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Premium color palette - Deep navy, gold accents, and emerald
const theme = {
  bg: {
    primary: 'from-[#0a0e1a] via-[#0f1419] to-[#050810]',
    card: 'bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80',
    cardHover: 'hover:from-slate-800/90 hover:via-slate-700/60 hover:to-slate-800/90',
  },
  text: {
    primary: 'text-slate-50',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    accent: 'text-amber-400',
  },
  accent: {
    primary: 'from-amber-400 via-yellow-500 to-amber-600',
    secondary: 'from-emerald-400 via-teal-500 to-cyan-600',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.3)]',
  },
  border: 'border-slate-700/50',
};


// Floating particles background
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#050810]" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <FloatingParticles />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-full text-sm text-amber-400"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Financial Intelligence</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="inline-block bg-gradient-to-r from-slate-50 via-slate-200 to-slate-300 bg-clip-text text-transparent">
              Your Guide in
            </span>
            <br />
            <motion.span
              className="inline-block bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: '200% auto',
              }}
            >
              Financial Mastery
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Empowering Chartered Accountants and individuals with AI-driven insights for compliance,
            tax optimization, and strategic financial decisions. Experience the future of accounting today.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.a
              href="/signup"
              className="group relative px-8 py-4 text-lg font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full overflow-hidden shadow-[0_0_40px_rgba(251,191,36,0.3)]"
              whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(251,191,36,0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Journey
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700"
                initial={{ x: '100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.4 }}
              />
            </motion.a>

            <motion.a
              href="#how-it-works"
              className="group px-8 py-4 text-lg font-medium text-slate-300 border-2 border-slate-700 rounded-full hover:border-amber-500/50 hover:bg-slate-900/50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-2">
                See How It Works
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {[
              { value: '40-60%', label: 'Time Saved', icon: Clock },
              { value: '<3 min', label: 'AI Response', icon: Zap },
              { value: '100%', label: 'Compliance', icon: ShieldCheck },
              { value: '24/7', label: 'Available', icon: Bot },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="relative group"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="relative p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <stat.icon className="w-8 h-8 text-amber-400 mb-3 mx-auto" />
                  <div className="text-3xl font-bold text-slate-50 mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-amber-400/30 rounded-full flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-2 bg-amber-400 rounded-full"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  tag?: string;
}

const FeatureCard = ({ icon: Icon, title, description, tag }: FeatureCardProps) => {
  return (
    <motion.div
      className="group relative h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
    >
      <div className="relative h-full p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl">
              <Icon className="w-6 h-6 text-amber-400" />
            </div>
            {tag && (
              <span className="px-3 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                {tag}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-slate-50 mb-2">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
};

// Main Landing Page
const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const caFeatures = [
    {
      icon: BarChart3,
      title: 'Unified Compliance Dashboard',
      description: 'Monitor ITR, GST, TDS, and ROC deadlines across your entire portfolio with intelligent risk assessment and automated reminders.',
      tag: 'For CAs',
    },
    {
      icon: MessageCircle,
      title: 'AI Tax Advisor',
      description: 'Get instant, accurate answers to complex Indian tax queries with proper citations, sections, and real-world case applications.',
      tag: 'Smart AI',
    },
    {
      icon: FileText,
      title: 'Intelligent Document Processing',
      description: 'Advanced OCR and AI extraction automatically reconciles ledgers, bank statements, and GST returns with human-level accuracy.',
      tag: 'Automated',
    },
  ];

  const citizenFeatures = [
    {
      icon: Sparkles,
      title: 'Guided Tax Wizard',
      description: 'Interactive step-by-step guidance to discover optimal tax-saving strategies across 80C, 80D, NPS, and more without complexity.',
      tag: 'Simple',
    },
    {
      icon: Users,
      title: 'Plain Language Reports',
      description: 'Every recommendation explained in clear, jargon-free language that anyone can understand and share confidently.',
      tag: 'Clear',
    },
    {
      icon: CheckCircle2,
      title: 'Actionable Insights',
      description: 'Generate comprehensive summaries with prioritized action items, ready to share with your CA or implement yourself.',
      tag: 'Ready',
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#050810] text-slate-50 overflow-x-hidden">
      <Header />
      <HeroSection />

      {/* For CAs Section */}
      <section id="for-ca" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-full text-sm text-amber-400"
              whileHover={{ scale: 1.05 }}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>For Chartered Accountants</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
                Your Command Center
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Transform your practice with AI-powered tools that handle the complexity while you focus on strategy and client relationships.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {caFeatures.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* For Citizens Section */}
      <section id="for-citizens" className="relative py-24 px-6 bg-gradient-to-b from-transparent via-slate-950/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="w-4 h-4" />
              <span>For Everyone</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Tax Made Simple
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              No finance degree required. Get personalized tax-saving recommendations explained in plain language.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {citizenFeatures.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
                Three Simple Steps
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              From data to decisions in minutes, not hours.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload & Connect',
                description: 'Securely upload documents or connect your accounting tools. Our AI standardizes and indexes everything automatically.',
                icon: UploadCloud,
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Advanced OCR and tax-aware models extract insights, identify patterns, and prepare intelligent recommendations.',
                icon: Bot,
              },
              {
                step: '03',
                title: 'Act with Confidence',
                description: 'Review AI-generated insights, approve recommendations, and file with complete peace of mind.',
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative group"
              >
                <div className="relative p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-6xl font-bold text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
                    {item.step}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 mb-6 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-amber-400" />
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-slate-50 mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="relative py-24 px-6 bg-gradient-to-b from-transparent via-slate-950/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-full text-sm text-red-400"
              whileHover={{ scale: 1.05 }}
            >
              <Lock className="w-4 h-4" />
              <span>Enterprise-Grade Security</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
                Built for Confidentiality
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Your financial data deserves bank-grade protection. We exceed industry standards for security and compliance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: 'End-to-End Encryption',
                description: 'Military-grade encryption in transit and at rest. Your data is protected at every step with zero-knowledge architecture.',
              },
              {
                icon: ShieldCheck,
                title: 'Compliance First',
                description: 'GDPR, SOC 2, and India data residency compliant. Regular third-party audits ensure we maintain the highest standards.',
              },
              {
                icon: Users,
                title: 'Role-Based Access',
                description: 'Granular permission controls for teams. Every action is logged and auditable for complete transparency.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="relative h-full p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 mb-4 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-red-400" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-50 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative p-12 bg-gradient-to-br from-slate-900/90 to-slate-800/70 backdrop-blur-xl border border-amber-500/20 rounded-3xl overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/10 to-transparent rounded-tr-full" />
            
            <div className="relative z-10 text-center">
              <motion.div
                className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-8 h-8 text-amber-400" />
              </motion.div>
              
              <blockquote className="text-2xl md:text-3xl font-medium text-slate-200 mb-8 leading-relaxed">
                "Arthasarthi transformed our practice. What used to take hours now takes minutes, and our clients love the transparency and speed."
              </blockquote>
              
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full" />
                <div className="text-left">
                  <div className="font-semibold text-slate-50">Rajesh Kumar, CA</div>
                  <div className="text-sm text-slate-400">Managing Partner, Kumar & Associates</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Ready to Transform Your Practice?
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              Join thousands of CAs and individuals who trust Arthasarthi for smarter financial decisions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="/signup"
                className="group relative px-10 py-5 text-lg font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full overflow-hidden shadow-[0_0_60px_rgba(251,191,36,0.4)]"
                whileHover={{ scale: 1.05, boxShadow: '0 0 80px rgba(251,191,36,0.6)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  Get Started Free
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.a>

              <motion.a
                href="#for-ca"
                className="px-10 py-5 text-lg font-medium text-slate-300 border-2 border-slate-700 rounded-full hover:border-amber-500/50 hover:bg-slate-900/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.a>
            </div>

            <p className="mt-8 text-sm text-slate-500">
              No credit card required • Free 14-day trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage