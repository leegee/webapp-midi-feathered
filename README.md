# MIDI Feathered Chords

A web app to feather notes played over any and all MIDI inputs, outputting to a device of your choice.

To help with loopback, input and output channels can be different.

Settings can be saved and restored through the Load and Save buttons.

Contains some novelty visualisations.

![Screenshot](.screenshot.png)

### About

A small application using Vite, React, Jotai, Web MIDI, mainly to compare React/Jotai to Vue3/Pinia. 

*NB* This project does not use MIDI USB, but the [Web MIDI API](https://caniuse.com/midi). 

The conclusion: this clearly ought to be event-based!

### To Do

* `notesOn` is now just pitch to velocity, so refactor
