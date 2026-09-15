import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUIStore, useBuildStore } from './store';
import { LandingPage } from './components/LandingPage';
import { BuildExperience } from './components/BuildExperience';
import { CompletedView } from './components/CompletedView';
import { AIGallery } from './components/AIGallery';
import { AIVideoViewer } from './components/AIVideoViewer';
import { About } from './components/About';

export default function App() {
  const isStarted = useUIStore((state) => state.isStarted);
  const isComplete = useBuildStore((state) => state.isComplete);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {!isStarted ? (
          <LandingPage key="landing" />
        ) : (
          <BuildExperience
            key="build"
            onOpenAbout={() => setIsAboutOpen(true)}
            onOpenGallery={() => setIsGalleryOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Completed View Modal */}
      {isComplete && (
        <CompletedView
          onOpenGallery={() => {
            setIsGalleryOpen(true);
          }}
        />
      )}

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <AIGallery
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      {/* Video Viewer Modal */}
      {isVideoViewerOpen && (
        <AIVideoViewer
          onClose={() => setIsVideoViewerOpen(false)}
        />
      )}

      {/* About Modal */}
      {isAboutOpen && (
        <About
          onClose={() => setIsAboutOpen(false)}
        />
      )}
    </div>
  );
}
