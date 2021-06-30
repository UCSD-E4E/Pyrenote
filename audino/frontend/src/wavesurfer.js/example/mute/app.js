// Create an instance
let wavesurfer;

// Init & load
document.addEventListener('DOMContentLoaded', function() {
    const playButton = document.querySelector('#playBtn');
    const toggleMuteButton = document.querySelector('#toggleMuteBtn');
    const setMuteOnButton = document.querySelector('#setMuteOnBtn');
    var setMuteOffButton = document.querySelector('#setMuteOffBtn');

    // Init wavesurfer
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'black'
    });

    wavesurfer.on('error', function(e) {
        console.warn(e);
    });

    wavesurfer.once('ready', function() {
        playButton.onclick = function() {
            wavesurfer.playPause();
        };

        toggleMuteButton.onclick = function() {
            wavesurfer.toggleMute();
        };

        setMuteOnButton.onclick = function() {
            wavesurfer.setMute(true);
        };

        setMuteOffButton.onclick = function() {
            wavesurfer.setMute(false);
        };
    });

    wavesurfer.load('../media/demo.wav');
});
