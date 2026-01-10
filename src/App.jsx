import React from 'react';
import LandingPage from './pages/LandingPage';
import SimulatorView from './views/SimulatorView';
import useSimulationStore from './store/useSimulationStore';

function App() {
  const view = useSimulationStore((state) => state.view);
  const setView = useSimulationStore((state) => state.setView);

  return (
    <div className="app-container">
      {view === 'landing' ? (
        <LandingPage onLaunch={() => setView('simulator')} />
      ) : (
        <SimulatorView />
      )}
    </div>
  );
}

export default App;