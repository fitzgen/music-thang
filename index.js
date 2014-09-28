const React = require("react");
const { DOM: dom } = React;

// React Components ------------------------------------------------------------

const makeFlexBoxClass = direction => React.createClass({
  render: function () {
    return this.transferPropsTo(dom.div(
      {
        style: {
          flex: this.props.flex,
          display: "flex",
          flexDirection: direction
        }
      },
      this.props.children
    ));
  }
});

const vbox = makeFlexBoxClass("column");
const hbox = makeFlexBoxClass("row");

const TimeVizCell = React.createClass({
  displayName: "TimeVizCell",

  render: function () {
    let className = "time-viz-cell";
    if (this.props.on) {
      className += " on";
    }

    return dom.div(
      {
        className,
        style: {
          flex: 1
        }
      },
      this.props.noteType.name
    );
  }
});

const TimeViz = React.createClass({
  displayName: "TimeViz",

  render: function () {
    return vbox(
      {
        className: "time-viz"
      },
      this.props.noteTypes.map((nt, idx) => TimeVizCell({
        key: "time-viz-cell-" + nt.name,
        noteType: nt,
        on: this.props.noteIndex % nt.mod === 0
      }))
    );
  }
});

const Pad = React.createClass({
  displayName: "Pad",

  render: function () {
    let className = "pad";
    if (this.props.noteTypes[this.props.noteType].scheduled.contains(this.props.sound.name)) {
      className += " on";
    }
    return dom.button(
      {
        className,
        tabIndex: "0",
        style: {
          flex: 1
        },
        onMouseDown: this._doScheduleSound,
        onMouseUp: this._doUnscheduleSound
      },
      this.props.padKey
    );
  },

  _doScheduleSound: function (e) {
    e.nativeEvent.preventDefault();
    this.props.scheduleSound(this.props.sound, this.props.noteType);
  },

  _doUnscheduleSound: function (e) {
    e.nativeEvent.preventDefault();
    this.props.unscheduleSound(this.props.sound, this.props.noteType);
  }
});

const PadsColumn = React.createClass({
  displayName: "PadsColumn",

  render: function () {
    return vbox(
      {
        flex: 1,
      },
      this.props.sound.keys.map((k, i) => Pad({
        key: "key-" + k,
        padKey: k,
        sound: this.props.sound,
        noteType: i,
        noteTypes: this.props.noteTypes,
        scheduleSound: this.props.scheduleSound,
        unscheduleSound: this.props.unscheduleSound
      }))
    );
  }
});

const Pads = React.createClass({
  displayName: "Pads",

  render: function () {
    return hbox(
      {
        flex: 1
      },
      this.props.sounds.map(s => PadsColumn({
        key: "pads-column-" + s.name,
        sound: s,
        noteTypes: this.props.noteTypes,
        scheduleSound: this.props.scheduleSound,
        unscheduleSound: this.props.unscheduleSound
      }))
    );
  }
});

const SoundsHeaderCell = React.createClass({
  displayName: "SoundsHeaderCell",

  render: function () {
    let className = "sounds-header-cell";
    if (this.props.on) {
      className += " on";
    }

    return dom.div(
      {
        className,
        style: {
          flex: 1
        }
      },
      this.props.sound.name
    );
  }
});

const SoundsHeader = React.createClass({
  displayName: "SoundsHeader",

  render: function () {
    return hbox(
      {
        flex: 1
      },
      this.props.sounds.map((s, idx) => SoundsHeaderCell({
        key: "sounds-header-cell-" + s.name,
        sound: s,
        on: this.props.noteTypes.some(nt =>
          nt.scheduled.contains(s.name) && this.props.noteIndex % nt.mod === 0)
      }))
    );
  }
});

function whenSoundKeys(listener) {
  return function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    const res = this._getKeySoundType(e.key.toUpperCase());
    if (!res) {
      return;
    }

    e.preventDefault();
    return listener.call(this, res);
  };
}

const BPMControls = React.createClass({
  displayName: "BPMControls",

  render: function () {
    return hbox(
      {
        className: "bpm"
      },
      dom.label(
        null,
        "BPM: " + this.props.bpm
      ),
      dom.input({
        ref: "range",
        type: "range",
        min: 50,
        max: 150,
        value: this.props.bpm,
        style: {
          flex: 1
        },

        onChange: this._update,
        onInput: this._update,
        onKeyDown: this._update,
        onMouseDown: this._update,
        onMouseMove: this._update
      })
    );
  },

  _update: function (e) {
    this.props.setBPM(this.refs.range.getDOMNode().value);
  }
});

const Thang = React.createClass({
  displayName: "Thang",

  getDefaultProps: () => ({
    sounds: [
      {
        name: "Kick 1",
        url: "",
        keys: ["2", "W", "S", "X"]
      },
      {
        name: "Kick 2",
        url: "",
        keys: ["3", "E", "D", "C"]
      },
      {
        name: "Snare 1",
        url: "",
        keys: ["4", "R", "F", "V"]
      },
      {
        name: "Snare 2",
        url: "",
        keys: ["5", "T", "G", "B"]
      },
      {
        name: "Closed Hi Hat",
        url: "",
        keys: ["6", "Y", "H", "N"]
      },
      {
        name: "Open Hi Hat",
        url: "",
        keys: ["7", "U", "J", "M"]
      },
      {
        name: "Tom 1",
        url: "",
        keys: ["8", "I", "K", ","]
      },
      {
        name: "Tom 2",
        url: "",
        keys: ["9", "O", "L", "."]
      },
    ],

    noteTypes: [
      {
        name: "1/2",
        mod: 8,
        scheduled: []
      },
      {
        name: "1/4",
        mod: 4,
        scheduled: []
      },
      {
        name: "1/8",
        mod: 2,
        scheduled: []
      },
      {
        name: "1/16",
        mod: 1,
        scheduled: []
      },
    ],

    bpm: 100,
    noteIndex: 0,
    lastNoteTime: Date.now()
  }),

  componentDidMount: function () {
    this.getDOMNode().querySelector("button").focus();
    loop(this);
  },

  render: function () {
    return vbox(
      {
        flex: 1,
        onKeyDown: this._onKeyDown,
        onKeyUp: this._onKeyUp
      },
      BPMControls({
        bpm: this.props.bpm,
        setBPM: this._setBPM
      }),
      hbox(
        null,
        dom.div({
          className: "spacer"
        }),
        SoundsHeader({
          sounds: this.props.sounds,
          noteIndex: this.props.noteIndex,
          noteTypes: this.props.noteTypes
        })
      ),
      hbox(
        {
          flex: 1
        },
        TimeViz({
          noteIndex: this.props.noteIndex,
          noteTypes: this.props.noteTypes
        }),
        Pads({
          sounds: this.props.sounds,
          noteTypes: this.props.noteTypes,
          scheduleSound: this._scheduleSound,
          unscheduleSound: this._unscheduleSound
        })
        // ,
        // dom.pre(null, JSON.stringify(this.props, null, 2))
      )
    );
  },

  _setBPM: function (bpm) {
    this.setProps({ bpm });
  },

  _getKeySoundType: function (key) {
    for (let s of this.props.sounds) {
      let idx = s.keys.indexOf(key);
      if (idx >= 0) {
        return {
          sound: s,
          noteTypeIndex: idx
        }
      }
    }
    return null;
  },

  _onKeyDown: whenSoundKeys(function ({ sound, noteTypeIndex }) {
    this._scheduleSound(sound, noteTypeIndex);
  }),

  _onKeyUp: whenSoundKeys(function ({ sound, noteTypeIndex }) {
    this._unscheduleSound(sound, noteTypeIndex);
  }),

  _scheduleSound: function (sound, noteTypeIndex) {
    this.setProps({
      noteTypes: this.props.noteTypes.map((nt, idx) => {
        if (idx !== noteTypeIndex) {
          return nt;
        }

        nt.scheduled = nt.scheduled.concat([sound.name]);
        return nt;
      })
    });
  },

  _unscheduleSound: function (sound, noteTypeIndex) {
    this.setProps({
      noteTypes: this.props.noteTypes.map((nt, idx) => {
        if (idx !== noteTypeIndex) {
          return nt;
        }

        nt.scheduled = nt.scheduled.filter(n => n !== sound.name);
        return nt;
      })
    });
  }
});

// App Logic -------------------------------------------------------------------

// Return number of ms for a 1/16th note.
function getShortestInterval(bpm) {
  return 60000 / bpm / 4;
}

// Main program loop.
function loop(component) {
  const schedule = () => requestAnimationFrame(() => loop(component));

  const interval = getShortestInterval(component.props.bpm);
  let notesHappened = 0;
  let lastTime = component.props.lastNoteTime;
  const now = Date.now();

  while (lastTime + interval < now) {
    notesHappened++;
    lastTime += interval;
  }

  if (!notesHappened) {
    return void schedule();
  }

  const currentNote = (component.props.noteIndex + notesHappened) % 8;

  // TODO FITZGEN: play current note's scheduled sounds here.

  component.setProps({
    noteIndex: currentNote,
    lastNoteTime: lastTime
  });
  schedule();
}

// App Initialization ----------------------------------------------------------

React.renderComponent(Thang(), document.body);
