import { Provider } from 'jotai';

import { MIDIComponent } from './components/MIDI';

function App() {
  return (
    <Provider>
      <MIDIComponent />
    </Provider>
  );
}

export default App;