import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { IdeaGeneration } from './views/IdeaGeneration';
import { RuleEngine } from './views/RuleEngine';
import { ContentPacks } from './views/ContentPacks';
import { CreateBrief } from './views/CreateBrief';
import { Editor } from './views/Editor';
import { ViewState } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'ideas': return <IdeaGeneration />;
      case 'rules': return <RuleEngine />;
      case 'packs': return <ContentPacks />;
      case 'briefs': return <CreateBrief />;
      case 'editor': return <Editor />;
      default: return <Dashboard />;
    }
  };

  // The Editor view has its own full-screen-ish layout usually, 
  // but for simplicity in this workspace app, we'll keep it within the Layout
  // except maybe we want to hide the sidebar? 
  // For now, let's keep it consistent.
  
  if (currentView === 'editor') {
     // A slightly different layout for Editor if desired, or just re-use Layout
     // Re-using layout for consistency as per prompt's "Workspace" feel
     return (
       <Layout currentView={currentView} onNavigate={setCurrentView}>
         {renderView()}
       </Layout>
     );
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}