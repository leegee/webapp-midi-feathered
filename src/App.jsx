import  { useEffect } from 'react';
import { Provider, useAtom } from 'jotai';
import { midiAccessAtom } from './lib/midi'; 

function MIDIComponent() {
  const [getMidiAccess, setMIDIAccess] = useAtom(midiAccessAtom);

  useEffect(() => {
    // Access MIDI when component mounts
    if (!getMidiAccess) {
      navigator.requestMIDIAccess().then(
        (access) => {
          setMIDIAccess(access);
        },
        (error) => {
          console.error('Failed to access MIDI devices:', error);
        }
      );
    }

    // Cleanup function
    return () => {
      if (getMidiAccess) {
        // Close the MIDI connection if open
        getMidiAccess.inputs.forEach((input) => {
          input.close();
        });
        getMidiAccess.outputs.forEach((output) => {
          output.close();
        });
      }
    };
  }, [getMidiAccess, setMIDIAccess]);

  return (
    <div>
      <h1>MIDI Access Status</h1>
      <p>{getMidiAccess ? 'MIDI Access Granted' : 'MIDI Access Denied'}</p>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <MIDIComponent />
    </Provider>
  );
}

export default App;