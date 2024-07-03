# MIDI Feathered Chords

A web app to feather notes played over any and all MIDI inputs, outputting to a device of your choice.

To help with loopback, input and output channels can be different.

Settings can be saved and restored through the Load and Save buttons.

Contains some novelty visualisations.

[Demo](https://leegee.github.io/webapp-midi-feathered) requires a [Web MIDI API](https://caniuse.com/midi) connection, not a MIDI-over-USB connection.

![Screenshot](.screenshot.png)

### Installation

    bun install

### Run/Dev
    
    bun run dev

### About

A small application using Vite, React, Jotai, Web MIDI, mainly to compare React/Jotai to Vue3/Pinia. 

### To Do

* Support sustain pedal

