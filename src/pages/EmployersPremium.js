import React from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone,
  TrendingUp,
  Zap,
  RefreshCw,
  Download,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Users,
  Target,
  TrendingDown,
  Shield,
  Sparkles
} from 'lucide-react';

const EmployersPremium = () => {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e28751]/20 backdrop-blur-md rounded-full border border-[#e28751]/30 mb-6"
            >
              <Target className="w-4 h-4 text-[#e28751]" />
              <span className="text-sm font-semibold text-[#e28751] tracking-wide">PARTNERSHIP SOLUTIONS</span>
            </motion.div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              Build Your Talent Pipeline.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14b8a6] to-[#a855f7]">
                Scale Your Operations.
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Access work-ready postgraduates in Civil Engineering, IT, and Consultancy. 
              Build consistent talent pipelines that power your growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-8 py-4 bg-[#e28751] hover:bg-[#d67742] text-white font-semibold rounded-full transition-all shadow-lg shadow-[#e28751]/30 flex items-center gap-3">
                <Download className="w-5 h-5" />
                Download Partnership Deck
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-white font-semibold rounded-full transition-all flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                Book a Strategy Call
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ways to Partner - Bento Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Ways to Partner
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Strategic partnership products designed to accelerate your hiring and strengthen your employer brand.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Card 1 - Brand Campaigns */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group p-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-[#e28751]/50 hover:shadow-xl hover:shadow-[#e28751]/10 transition-all"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#e28751] to-[#d67742] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Megaphone className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#e28751] transition-colors">
                    Brand Campaigns
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    Custom Brand Campaigns to elevate your presence in the grad market.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2 - Promoted Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group p-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-[#14b8a6]/50 hover:shadow-xl hover:shadow-[#14b8a6]/10 transition-all"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#14b8a6] to-[#0d9488] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#14b8a6] transition-colors">
                    Promoted Opportunities
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    Boost job visibility by 4x with featured placement algorithms.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 3 - Future-Proof Talent */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group p-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-[#a855f7]/50 hover:shadow-xl hover:shadow-[#a855f7]/10 transition-all"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#a855f7] to-[#9333ea] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#a855f7] transition-colors">
                    Future-Proof Talent
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    Access 'Work-Ready' postgraduates with verified technical certifications.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 4 - Business Continuity */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="group p-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    Business Continuity
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    Build consistent talent pipelines to ensure operational stability and market growth.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Market Impact Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900/50 to-[#0f172a]">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#14b8a6]/20 backdrop-blur-md rounded-full border border-[#14b8a6]/30 mb-6">
              <Sparkles className="w-4 h-4 text-[#14b8a6]" />
              <span className="text-sm font-semibold text-[#14b8a6] tracking-wide">PROVEN RESULTS</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Scale Your Operations
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Data-driven outcomes from organizations building their talent pipelines through PlacementsPortal.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center p-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-[#14b8a6]/50 transition-all"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#14b8a6] to-[#0d9488] rounded-full mb-6">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-3">45<span className="text-[#14b8a6]">%</span></div>
              <p className="text-lg text-slate-400 font-medium">
                Reduction in<br />Time-to-Hire
              </p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center p-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-[#a855f7]/50 transition-all"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#a855f7] to-[#9333ea] rounded-full mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-3">90<span className="text-[#a855f7]">%</span></div>
              <p className="text-lg text-slate-400 font-medium">
                Candidate<br />Retention Rate
              </p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center p-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-[#e28751]/50 transition-all"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#e28751] to-[#d67742] rounded-full mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-3">Top <span className="text-[#e28751]">10%</span></div>
              <p className="text-lg text-slate-400 font-medium">
                Exclusive Access to<br />Postgrad Talent
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold text-white mb-12 text-center"
            >
              Why Leading Organizations Partner With Us
            </motion.h2>

            <div className="space-y-6">
              {[
                'Pre-vetted candidates with verified technical certifications and work-readiness assessments',
                'Dedicated account management with strategic hiring consultation and market insights',
                'Employer brand amplification through featured content and targeted campaign distribution',
                'Reduced hiring costs with streamlined processes and higher retention rates',
                'Priority access to emerging talent before competitors enter the market',
                'Comprehensive analytics dashboard tracking engagement, applications, and conversion metrics'
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-5 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl hover:border-[#14b8a6]/50 transition-all"
                >
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-[#14b8a6]" />
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#0f172a] via-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to Build Your Talent Pipeline?
            </h2>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Join 100+ organizations scaling their operations with verified, work-ready postgraduate talent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-8 py-4 bg-[#e28751] hover:bg-[#d67742] text-white font-semibold rounded-full transition-all shadow-lg shadow-[#e28751]/30 flex items-center gap-3">
                <Download className="w-5 h-5" />
                Download Partnership Deck
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-white font-semibold rounded-full transition-all flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                Book a Strategy Call
              </button>
            </div>

            <p className="mt-8 text-slate-400 text-sm">
              Questions? Email us at <a href="mailto:partnerships@placementsportal.com" className="text-[#14b8a6] hover:text-[#0d9488] transition-colors">partnerships@placementsportal.com</a>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EmployersPremium;
