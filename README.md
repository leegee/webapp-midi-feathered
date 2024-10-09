# MIDI Feathered Chords

A web app to feather notes played over any and all MIDI inputs, outputting to a device of your choice.

Similar to [the Seldon Black software Bear McCreary used for the Foundation soundtrack](https://www.youtube.com/watch?v=x7jk0uAB9XY&t=95s), though developed independently and originally producing notes via L-systems. I do not watch a lot of television, and loved the Asmiov books when I read them 40-odd years ago, so it took me a while to even hear of the Foundation series, let alone watch it. Must do better.

* To help with loopback, input and output channels can be different.

* Current settings are restored on reloading

* Settings can be saved and restored through the Load and Save buttons.

* Contains some novelty visualisations and a novelty interactive on-screen keyboard.

[Demo](https://leegee.github.io/webapp-midi-feathered) requires a [Web MIDI API](https://caniuse.com/midi) connection, not a MIDI-over-USB connection.

![Screenshot](.screenshot.png)

### Installation

    bun install

### Run/Dev
    
    bun run dev

### Dependencies Lock File

GitHub Actions does not support a Bun lockfile, so an NPM lockfile is included. Ugh.

### To Do

Touch a lamp above/below each range slider to toggle MIDI learn for that end of the range slider.

#### States

* Off 
* * Mode: By-passed
* * Meaning: No CC associated with that end of this range
* * Action: activate to enter 'MIDI Learn' moder, restoring any previous value as default
* Flashing
* * Mode: MIDI Learn
* * Meaning: the next used CC will be assigned to this end of this range and the mode will be set to 'Active'
* * Action: de-activates 'MIDI Learn' mode
* Solid, unblinking
* * Mode: Active
* * Meaning: the specified CC (displayed by the lit lamp) controls this range of this control
* * Action: Enter 'By-passed' mode

That is, to link a controller to the end of a range,  click to ilght a lamp and enter 'MIDI Learn' mode, then activate a controller to assign it. To deactive, click the same lamp again. To reactivate or relearn, click the lamp again.

### About

A small application using Vite, React, Jotai, Web MIDI, mainly to compare React/Jotai to Vue3/Pinia. 

### To Do

* Support sustain pedal

