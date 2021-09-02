/* eslint-disable  eqeqeq */
import * as util from './util';

// using constants to prevent someone writing the string wrong
const PLAYING = 'playing';
const PAUSED = 'paused';
const FINISHED = 'finished';

/**
 * WebAudio backend
 *
 * @extends {Observer}
 */
export default class WebAudio extends util.Observer {
  /** scriptBufferSize: size of the processing buffer */
  static scriptBufferSize = 256;

  /** audioContext: allows to process audio with WebAudio API */
  audioContext = null;

  /** @private */
  offlineAudioContext = null;

  /** @private */
  stateBehaviors = {
    [PLAYING]: {
      init() {
        this.addOnAudioProcess();
      },
      getPlayedPercents() {
        const duration = this.getDuration();
        return this.getCurrentTime() / duration || 0;
      },
      getCurrentTime() {
        return this.startPosition + this.getPlayedTime();
      }
    },
    [PAUSED]: {
      init() {
        this.removeOnAudioProcess();
      },
      getPlayedPercents() {
        const duration = this.getDuration();
        return this.getCurrentTime() / duration || 0;
      },
      getCurrentTime() {
        return this.startPosition;
      }
    },
    [FINISHED]: {
      init() {
        this.removeOnAudioProcess();
        this.fireEvent('finish');
      },
      getPlayedPercents() {
        return 1;
      },
      getCurrentTime() {
        return this.getDuration();
      }
    }
  };

  /**
   * Does the browser support this backend
   *
   * @return {boolean} Whether or not this browser supports this backend
   */
  supportsWebAudio() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Get the audio context used by this backend or create one
   *
   * @return {AudioContext} Existing audio context, or creates a new one
   */
  getAudioContext() {
    if (!window.WaveSurferAudioContext) {
      window.WaveSurferAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window.WaveSurferAudioContext;
  }

  /**
   * Get the offline audio context used by this backend or create one
   *
   * @param {number} sampleRate The sample rate to use
   * @return {OfflineAudioContext} Existing offline audio context, or creates
   * a new one
   */
  getOfflineAudioContext(sampleRate) {
    if (!window.WaveSurferOfflineAudioContext) {
      window.WaveSurferOfflineAudioContext = new (window.OfflineAudioContext ||
        window.webkitOfflineAudioContext)(1, 2, sampleRate);
    }
    return window.WaveSurferOfflineAudioContext;
  }

  /**
   * Construct the backend
   *
   * @param {WavesurferParams} params Wavesurfer parameters
   */
  constructor(params) {
    super();
    /** @private */
    this.params = params;
    /** ac: Audio Context instance */
    this.ac = params.audioContext || (this.supportsWebAudio() ? this.getAudioContext() : {});
    /** @private */
    this.lastPlay = this.ac.currentTime;
    /** @private */
    this.startPosition = 0;
    /** @private */
    this.scheduledPause = null;
    /** @private */
    this.states = {
      [PLAYING]: Object.create(this.stateBehaviors[PLAYING]),
      [PAUSED]: Object.create(this.stateBehaviors[PAUSED]),
      [FINISHED]: Object.create(this.stateBehaviors[FINISHED])
    };

    /**
     * Does the browser support this backend
     *
     * @return {boolean} Whether or not this browser supports this backend
     */
    supportsWebAudio() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    /**
     * Get the audio context used by this backend or create one
     *
     * @return {AudioContext} Existing audio context, or creates a new one
     */
    getAudioContext() {
        if (!window.WaveSurferAudioContext) {
            window.WaveSurferAudioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
        }
        return window.WaveSurferAudioContext;
    }

    /**
     * Get the offline audio context used by this backend or create one
     *
     * @param {number} sampleRate The sample rate to use
     * @return {OfflineAudioContext} Existing offline audio context, or creates
     * a new one
     */
    getOfflineAudioContext(sampleRate) {
        window.WaveSurferOfflineAudioContext = new (window.OfflineAudioContext ||
            window.webkitOfflineAudioContext)(1, 2, sampleRate);
        return window.WaveSurferOfflineAudioContext;
    }

    /**
     * Construct the backend
     *
     * @param {WavesurferParams} params Wavesurfer parameters
     */
    constructor(params) {
        super();
        /** @private */
        this.params = params;
        /** ac: Audio Context instance */
        this.ac =
            params.audioContext ||
            (this.supportsWebAudio() ? this.getAudioContext() : {});
        /**@private */
        this.lastPlay = this.ac.currentTime;
        /** @private */
        this.startPosition = 0;
        /** @private */
        this.scheduledPause = null;
        /** @private */
        this.states = {
            [PLAYING]: Object.create(this.stateBehaviors[PLAYING]),
            [PAUSED]: Object.create(this.stateBehaviors[PAUSED]),
            [FINISHED]: Object.create(this.stateBehaviors[FINISHED])
        };
        /** @private */
        this.buffer = null;
        /** @private */
        this.filters = [];
        /** gainNode: allows to control audio volume */
        this.gainNode = null;
        /** @private */
        this.mergedPeaks = null;
        /** @private */
        this.offlineAc = null;
        /** @private */
        this.peaks = null;
        /** @private */
        this.playbackRate = 1;
        /** analyser: provides audio analysis information */
        this.analyser = null;
        /** scriptNode: allows processing audio */
        this.scriptNode = null;
        /** @private */
        this.source = null;
        /** @private */
        this.splitPeaks = [];
        /** @private */
        this.state = null;
        /** @private */
        this.explicitDuration = params.duration;
        /**
         * Boolean indicating if the backend was destroyed.
         */
        this.destroyed = false;
    }

    /**
     * Initialise the backend, called in `wavesurfer.createBackend()`
     */
    init() {
        this.createVolumeNode();
        this.createScriptNode();
        this.createAnalyserNode();

        this.setState(PAUSED);
        this.setPlaybackRate(this.params.audioRate);
        this.setLength(0);
    }

    /** @private */
    this.buffer = null;
    /** @private */
    this.filters = [];
    /** gainNode: allows to control audio volume */
    this.gainNode = null;
    /** @private */
    this.mergedPeaks = null;
    /** @private */
    this.offlineAc = null;
    /** @private */
    this.peaks = null;
    /** @private */
    this.playbackRate = 1;
    /** analyser: provides audio analysis information */
    this.analyser = null;
    /** scriptNode: allows processing audio */
    this.scriptNode = null;
    /** @private */
    this.source = null;
    /** @private */
    this.splitPeaks = [];
    /** @private */
    this.state = null;
    /** @private */
    this.explicitDuration = params.duration;
    /**
     * Boolean indicating if the backend was destroyed.
     */

    async decodeArrayBuffer(arraybuffer, callback, errback, sampleRate) {
        console.log("in decode array buffer", sampleRate, sampleRate ? sampleRate: this.ac && this.ac.sampleRate ? this.ac.sampleRate : 44100)
        this.offlineAc = this.getOfflineAudioContext(
            sampleRate ? sampleRate: this.ac && this.ac.sampleRate ? this.ac.sampleRate : 44100
        );

        console.log(this.offlineAc)

        if ('webkitAudioContext' in window) {
            // Safari: no support for Promise-based decodeAudioData enabled
            // Enable it in Safari using the Experimental Features > Modern WebAudio API option
            this.offlineAc.decodeAudioData(
                arraybuffer,
                data => callback(data),
                errback
            );
        } else {

            /*const context = new (window.AudioContext || window.webkitAudioContext)();
            const audiobuffer = await context.decodeAudioData( arraybuffer );
            console.log(audiobuffer)
            callback(audiobuffer)*/
            console.log("here")
            //var audioCtx = new (window.AudioContext || window.webkitAudioContext)(1, 2, sampleRate);
            console.log(arraybuffer)
            await this.offlineAc.decodeAudioData(arraybuffer,  (data) => {
                callback(data)
                console.log("here", data)
            },
            err => errback(err))

        }
    }

    /**
     * Set pre-decoded peaks
     *
     * @param {number[]|Number.<Array[]>} peaks Peaks data
     * @param {?number} duration Explicit duration
     */
    setPeaks(peaks, duration) {
        if (duration != null) {
            this.explicitDuration = duration;
        }
        this.peaks = peaks;
    }

    /**
     * The following snippet fixes a buffering data issue on the Safari
     * browser which returned undefined It creates the missing buffer based
     * on 1 channel, 4096 samples and the sampleRate from the current
     * webaudio context 4096 samples seemed to be the best fit for rendering
     * will review this code once a stable version of Safari TP is out
     */
    if (!this.buffer.length) {
      const newBuffer = this.createBuffer(1, 4096, this.sampleRate);
      this.buffer = newBuffer.buffer;
    }

    const sampleSize = this.buffer.length / length;
    const sampleStep = ~~(sampleSize / 10) || 1;
    const channels = this.buffer.numberOfChannels;
    let c;

    for (c = 0; c < channels; c++) {
      const peaks = this.splitPeaks[c];
      const chan = this.buffer.getChannelData(c);
      let i;

      for (i = first; i <= last; i++) {
        const start = ~~(i * sampleSize);
        const end = ~~(start + sampleSize);
        /**
         * Initialize the max and min to the first sample of this
         * subrange, so that even if the samples are entirely
         * on one side of zero, we still return the true max and
         * min values in the subrange.
         */
        let min = chan[start];
        let max = min;
        let j;

        for (j = start; j < end; j += sampleStep) {
          const value = chan[j];

          if (value > max) {
            max = value;
          }

          if (value < min) {
            min = value;
          }
        }

        peaks[2 * i] = max;
        peaks[2 * i + 1] = min;

        if (c == 0 || max > this.mergedPeaks[2 * i]) {
          this.mergedPeaks[2 * i] = max;
        }

        if (c == 0 || min < this.mergedPeaks[2 * i + 1]) {
          this.mergedPeaks[2 * i + 1] = min;
        }
      }
    }

    return this.params.splitChannels ? this.splitPeaks : this.mergedPeaks;
  }

  /**
   * Get the position from 0 to 1
   *
   * @return {number} Position
   */
  getPlayedPercents() {
    return this.state.getPlayedPercents.call(this);
  }

  /** @private */
  disconnectSource() {
    if (this.source) {
      this.source.disconnect();
    }
  }

  /**
   * Destroy all references with WebAudio, disconnecting audio nodes and closing Audio Context
   */
  destroyWebAudio() {
    this.disconnectFilters();
    this.disconnectSource();
    this.gainNode.disconnect();
    this.scriptNode.disconnect();
    this.analyser.disconnect();

    // close the audioContext if closeAudioContext option is set to true
    if (this.params.closeAudioContext) {
      // check if browser supports AudioContext.close()
      if (typeof this.ac.close === 'function' && this.ac.state != 'closed') {
        this.ac.close();
      }
      // clear the reference to the audiocontext
      this.ac = null;
      // clear the actual audiocontext, either passed as param or the
      // global singleton
      if (!this.params.audioContext) {
        window.WaveSurferAudioContext = null;
      } else {
        this.params.audioContext = null;
      }
      // clear the offlineAudioContext
      window.WaveSurferOfflineAudioContext = null;
    }
  }

  /**
   * This is called when wavesurfer is destroyed
   */
  destroy() {
    if (!this.isPaused()) {
      this.pause();
    }
    this.unAll();
    this.buffer = null;
    this.destroyed = true;

    this.destroyWebAudio();
  }

  /**
   * Loaded a decoded audio buffer
   *
   * @param {Object} buffer Decoded audio buffer to load
   */
  load(buffer) {
    this.startPosition = 0;
    this.lastPlay = this.ac.currentTime;
    this.buffer = buffer;
    this.createSource();
  }

  /** @private */
  createSource() {
    this.disconnectSource();
    this.source = this.ac.createBufferSource();

    // adjust for old browsers
    this.source.start = this.source.start || this.source.noteGrainOn;
    this.source.stop = this.source.stop || this.source.noteOff;

    this.setPlaybackRate(this.playbackRate);
    this.source.buffer = this.buffer;
    this.source.connect(this.analyser);
  }

  /**
   * @private
   *
   * some browsers require an explicit call to #resume before they will play back audio
   */
  resumeAudioContext() {
    if (this.ac.state == 'suspended') {
      this.ac.resume && this.ac.resume();
    }
  }

  /**
   * Used by `wavesurfer.isPlaying()` and `wavesurfer.playPause()`
   *
   * @return {boolean} Whether or not this backend is currently paused
   */
  isPaused() {
    return this.state !== this.states[PLAYING];
  }

  /**
   * Used by `wavesurfer.getDuration()`
   *
   * @return {number} Duration of loaded buffer
   */
  getDuration() {
    if (this.explicitDuration) {
      return this.explicitDuration;
    }
    if (!this.buffer) {
      return 0;
    }
    return this.buffer.duration;
  }

  /**
   * Used by `wavesurfer.seekTo()`
   *
   * @param {number} start Position to start at in seconds
   * @param {number} end Position to end at in seconds
   * @return {{start: number, end: number}} Object containing start and end
   * positions
   */
  seekTo(start, end) {
    if (!this.buffer) {
      return;
    }

    this.scheduledPause = null;

    if (start == null) {
      start = this.getCurrentTime();
      if (start >= this.getDuration()) {
        start = 0;
      }
    }
    if (end == null) {
      end = this.getDuration();
    }

    this.startPosition = start;
    this.lastPlay = this.ac.currentTime;

    if (this.state === this.states[FINISHED]) {
      this.setState(PAUSED);
    }

    return {
      start,
      end
    };
  }

  /**
   * Get the playback position in seconds
   *
   * @return {number} The playback position in seconds
   */
  getPlayedTime() {
    return (this.ac.currentTime - this.lastPlay) * this.playbackRate;
  }

  /**
   * Plays the loaded audio region.
   *
   * @param {number} start Start offset in seconds, relative to the beginning
   * of a clip.
   * @param {number} end When to stop relative to the beginning of a clip.
   */
  play(start, end) {
    if (!this.buffer) {
      return;
    }

    // need to re-create source on each playback
    this.createSource();

    const adjustedTime = this.seekTo(start, end);

    start = adjustedTime.start;
    end = adjustedTime.end;

    this.scheduledPause = end;

    this.source.start(0, start);

    this.resumeAudioContext();

    this.setState(PLAYING);

    this.fireEvent('play');
  }

  /**
   * Pauses the loaded audio.
   */
  pause() {
    this.scheduledPause = null;

    this.startPosition += this.getPlayedTime();
    try {
      this.source && this.source.stop(0);
    } catch (err) {
      // Calling stop can throw the following 2 errors:
      // - RangeError (The value specified for when is negative.)
      // - InvalidStateNode (The node has not been started by calling start().)
      // We can safely ignore both errors, because:
      // - The range is surely correct
      // - The node might not have been started yet, in which case we just want to carry on without causing any trouble.
    }

    this.setState(PAUSED);

    this.fireEvent('pause');
  }

  /**
   * Returns the current time in seconds relative to the audio-clip's
   * duration.
   *
   * @return {number} The current time in seconds
   */
  getCurrentTime() {
    return this.state.getCurrentTime.call(this);
  }

  /**
   * Returns the current playback rate. (0=no playback, 1=normal playback)
   *
   * @return {number} The current playback rate
   */
  getPlaybackRate() {
    return this.playbackRate;
  }

  /**
   * Set the audio source playback rate.
   *
   * @param {number} value The playback rate to use
   */
  setPlaybackRate(value) {
    this.playbackRate = value || 1;
    this.source && this.source.playbackRate.setValueAtTime(this.playbackRate, this.ac.currentTime);
  }

  /**
   * Set a point in seconds for playback to stop at.
   *
   * @param {number} end Position to end at
   * @version 3.3.0
   */
  setPlayEnd(end) {
    this.scheduledPause = end;
  }
}
