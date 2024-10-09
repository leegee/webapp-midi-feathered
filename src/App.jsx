import { Provider } from 'jotai';

import MidiHost from './components/MidiHost';

function App () {
  return (
    <Provider>
      <MidiHost />
    </Provider>
  );
}

export default App;