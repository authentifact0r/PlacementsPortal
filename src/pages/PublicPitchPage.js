import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  Briefcase,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  Star,
  TrendingUp,
  Eye,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const PublicPitchPage = () => {
  const { pitchId } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoRef, setVideoRef] = useState(null);
  const [showCVPreview, setShowCVPreview] = useState(false);

  // Mock student data - replace with Firebase fetch
  // eslint-disable-next-line no-unused-vars
  const [student, setStudent] = useState({
    name: 'Sarah Mitchell',
    headshot: 'https://ui-avatars.com/api/?name=Sarah+Mitchell&size=200&background=6366f1&color=fff&bold=true',
    degree: 'MEng Civil Engineering',
    university: 'Imperial College London',
    location: 'London, UK',
    topSkills: ['AutoCAD', 'Structural Analysis', 'Project Management'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoDuration: '45s',
    cvUrl: '/cv/sarah-mitchell-cv.pdf',
    bio: 'Passionate civil engineer with 2 years experience in infrastructure design. Seeking graduate roles in sustainable construction projects.',
    achievements: [
      'First Class Honours',
      'Dean\'s List 2023',
      'Winner - Engineering Design Competition'
    ],
    experience: [
      { role: 'Engineering Intern', company: 'Arup', duration: '6 months' },
      { role: 'Research Assistant', company: 'Imperial College', duration: '1 year' }
    ],
    verified: true,
    views: 1247,
    rating: 4.8
  });

  useEffect(() => {
    // TODO: Fetch student pitch data from Firebase
    // const fetchPitch = async () => {
    //   const pitchDoc = await getDoc(doc(db, 'video_pitches', pitchId));
    //   setStudent(pitchDoc.data());
    // };
  }, [pitchId]);

  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef) {
      videoRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef) {
      if (videoRef.requestFullscreen) {
        videoRef.requestFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] relative overflow-hidden">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-8 py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </motion.button>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video & Profile (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Spotlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              {/* Video Container */}
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl">
                <video
                  ref={setVideoRef}
                  src={student.videoUrl}
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Verified Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-white">Verified by PlacementsPortal</span>
                </div>

                {/* Play Overlay */}
                {!isPlaying && (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent"
                  >
                    <button
                      onClick={handlePlayPause}
                      className="w-20 h-20 bg-white/20 backdrop-blur-xl border-2 border-white/40 rounded-full flex items-center justify-center hover:scale-110 transition-transform group"
                    >
                      <Play className="w-10 h-10 text-white ml-1" />
                    </button>
                  </motion.div>
                )}

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePlayPause}
                        className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={handleMuteToggle}
                        className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>

                      <span className="text-xs text-white/80 font-medium">{student.videoDuration}</span>
                    </div>

                    <button
                      onClick={handleFullscreen}
                      className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <Maximize className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-white/80">{student.views.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white/80">{student.rating} rating</span>
                </div>
              </div>
            </motion.div>

            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">About {student.name.split(' ')[0]}</h2>
              <p className="text-white/80 leading-relaxed mb-6">{student.bio}</p>

              {/* Achievements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Key Achievements
                </h3>
                <div className="space-y-2">
                  {student.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-white/80">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                  Experience
                </h3>
                <div className="space-y-3">
                  {student.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{exp.role}</div>
                        <div className="text-sm text-white/60">{exp.company} • {exp.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Profile Sidebar (1/3) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="sticky top-8 space-y-6"
            >
              {/* Professional Profile Card */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                {/* Headshot */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <img
                      src={student.headshot}
                      alt={student.name}
                      className="w-32 h-32 rounded-full border-4 border-white/20 shadow-xl mx-auto"
                    />
                    {student.verified && (
                      <div className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 border-4 border-[#0f172a] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white mt-4 mb-1">{student.name}</h1>
                  <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                    <MapPin className="w-4 h-4" />
                    {student.location}
                  </div>
                </div>

                {/* Key Stats */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <GraduationCap className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-white/60 mb-1">Degree</div>
                      <div className="font-semibold text-white text-sm">{student.degree}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <Award className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-white/60 mb-1">University</div>
                      <div className="font-semibold text-white text-sm">{student.university}</div>
                    </div>
                  </div>
                </div>

                {/* Top Skills */}
                <div className="mb-6">
                  <div className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider">Top 3 Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {student.topSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-teal-500/20 border border-white/20 rounded-full text-sm font-semibold text-white"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CV Preview Button */}
                <button
                  onClick={() => setShowCVPreview(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 mb-4"
                >
                  <Eye className="w-5 h-5" />
                  Preview & Download CV
                </button>

                {/* Engagement Actions */}
                <div className="space-y-3">
                  <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" />
                    Message Student
                  </button>

                  <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Book Interview
                  </button>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-sm text-white/60 mb-3">Share this profile</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/20 rounded-lg text-white text-sm font-semibold transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CV Preview Modal */}
      {showCVPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          onClick={() => setShowCVPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[90vh] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent">
              <div>
                <h3 className="text-xl font-bold text-white">{student.name}'s CV</h3>
                <p className="text-sm text-white/60">Preview before downloading</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={student.cvUrl}
                  download
                  onClick={() => setShowCVPreview(false)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setShowCVPreview(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* CV Preview */}
            <div className="w-full h-full pt-20">
              <iframe
                src={student.cvUrl}
                title="CV Preview"
                className="w-full h-full bg-white rounded-b-3xl"
                style={{ border: 'none' }}
              />
            </div>

            {/* Zoom Controls (Optional) */}
            <div className="absolute bottom-6 right-6 flex items-center gap-2">
              <button className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center transition-colors">
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center transition-colors">
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PublicPitchPage;
