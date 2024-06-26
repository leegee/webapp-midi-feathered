import { Provider } from 'jotai';

import MIDIApp from './components/MIDI';

function App () {
  return (
    <Provider>
      <MIDIApp />
    </Provider>
  );
}

export default App;