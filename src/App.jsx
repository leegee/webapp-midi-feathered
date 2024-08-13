import { Provider } from 'jotai';

import MIDIApp from './components/MidiHost';

function App () {
  return (
    <Provider>
      <MIDIApp />
    </Provider>
  );
}

export default App;