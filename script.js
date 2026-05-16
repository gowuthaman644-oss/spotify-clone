// Service Worker for Offline PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed: ', err));
    });
}

const songs = [
    {
        title: "Kannukulla",
        artist: "Anirudh Ravichander",
        url: "https://res.cloudinary.com/dhcmagqn8/video/upload/q_auto/f_auto/v1778921283/Kannukulla_oalsic.mp3",
        cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80"
    },
    {
        title: "Dheema",
        artist: "A.R. Rahman",
        url: "https://res.cloudinary.com/dhcmagqn8/video/upload/q_auto/f_auto/v1778921280/Dheema_fqoju5.mp3",
        cover: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80"
    },
    {
        title: "Oorum Blood",
        artist: "Hiphop Tamizha",
        url: "https://res.cloudinary.com/dhcmagqn8/video/upload/q_auto/f_auto/v1778921276/Oorum_Blood_sq22my.mp3",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"
    },
    {
        title: "Kurumugil",
        artist: "Yuvan Shankar Raja",
        url: "https://res.cloudinary.com/dhcmagqn8/video/upload/q_auto/f_auto/v1778921276/Kurumugil-MassTamilan.dev_aivlur.mp3",
        cover: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80"
    },
    {
        title: "Master the Blaster",
        artist: "Anirudh Ravichander",
        url: "https://res.cloudinary.com/dhcmagqn8/video/upload/q_auto/f_auto/v1778921275/Master-the-Blaster-MassTamilan.io_dvar58.mp3",
        cover: "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=400&q=80"
    },
    {
        title: "Pavazha Malli",
        artist: "A.R. Rahman",
        url: "https://res.cloudinary.com/dhcmagqn8/video/upload/q_auto/f_auto/v1778921266/Pavazha_Malli_xwbfpy.mp3",
        cover: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&q=80"
    }
];


const audio = document.getElementById('audio-element');
const playPauseBtn = document.getElementById('play-pause');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const volumeContainer = document.getElementById('volume-container');
const volumeBar = document.getElementById('volume-bar');

const currentCover = document.getElementById('current-cover');
const currentTitle = document.getElementById('current-title');
const currentArtist = document.getElementById('current-artist');

const recentGrid = document.getElementById('recent-grid');
const songsContainer = document.getElementById('songs-container');
const trendingContainer = document.getElementById('trending-container');

const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const likeBtn = document.getElementById('like-btn');
const muteBtn = document.getElementById('mute-btn');
const queueBtn = document.getElementById('queue-btn');
const playbar = document.querySelector('.playbar');
const homeBtn = document.querySelector('.nav-btn');
const fullscreenBtn = document.getElementById('mini-player-btn');

// New Advanced Feature Elements
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');
const miniPlayerBtn = document.getElementById('mini-player-btn');
const lyricsBtn = document.getElementById('lyrics-btn');
const lyricsModal = document.getElementById('lyrics-modal');
const closeLyrics = document.getElementById('close-lyrics');
const toastContainer = document.getElementById('toast-container');
const visualizerCanvas = document.getElementById('audio-visualizer');

// Auth Elements
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const authToggle = document.getElementById('auth-toggle');
const signupFields = document.getElementById('signup-fields');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authEmail = document.getElementById('auth-email');
const rememberMe = document.getElementById('remember-me');
const profileIcon = document.getElementById('profile-icon');
const profileDropdown = document.getElementById('profile-dropdown');
const displayUsername = document.getElementById('display-username');
const logoutBtn = document.getElementById('logout-btn');

// Removed old Hero Banner Elements, now using Right Cover for animations
const rightCoverAnim = document.getElementById('right-cover');

let songIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isMuted = false;
let previousVolume = 1;
let repeatMode = 0; // 0: off, 1: all, 2: one
let playQueue = [];
let audioCtx, analyser, dataArray, canvasCtx;
let isVisualizerInitialized = false;

// Global Auth State
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(sessionStorage.getItem('currentUser')) || null;
let isSignUp = false;

// Local Storage State
let likedSongs = new Set(JSON.parse(localStorage.getItem('likedSongs')) || []);
let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
let savedTheme = localStorage.getItem('themeColor') || 'dark';
let customAccent = localStorage.getItem('customAccent');

if (customAccent) {
    document.documentElement.style.setProperty('--accent', customAccent);
    document.documentElement.style.setProperty('--accent-glow', customAccent + '80'); // 50% opacity
}

if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

function saveState() {
    localStorage.setItem('likedSongs', JSON.stringify([...likedSongs]));
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
}

// Initialize app
function init() {
    initParticles();
    
    if (currentUser) {
        // User already logged in, bypass auth completely
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('login-screen').style.display = 'none';
        
        setupMainApp();
    } else {
        // Splash Screen Logic
        setTimeout(() => {
            document.getElementById('splash-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('splash-screen').style.display = 'none';
                document.getElementById('login-screen').style.display = 'flex';
            }, 500);
        }, 2000);
    }
}

function setupMainApp() {
    const mainApp = document.getElementById('main-app');
    mainApp.style.opacity = '1';
    mainApp.style.pointerEvents = 'all';
    
    // Setup Profile UI
    displayUsername.innerText = currentUser.username;
    if (currentUser.avatar) {
        profileIcon.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar">`;
    } else {
        profileIcon.innerHTML = currentUser.username.charAt(0).toUpperCase();
        profileIcon.style.color = '#fff';
        profileIcon.style.fontWeight = 'bold';
    }

    renderSkeletons();
    setTimeout(() => {
        renderSongs();
        renderRecent();
        if (songs.length > 0) {
            loadSong(songs[0], false);
        }
    }, 1000);
    
    volumeBar.style.width = '100%';
    audio.volume = 1;
}

// Auth Logic
authToggle.addEventListener('click', () => {
    isSignUp = !isSignUp;
    if (isSignUp) {
        authTitle.innerText = 'Sign up for free';
        authBtn.innerText = 'Sign Up';
        signupFields.style.display = 'block';
        authToggle.innerHTML = 'Already have an account? <span>Log in</span>';
    } else {
        authTitle.innerText = 'Log in to Spotify';
        authBtn.innerText = 'Log In';
        signupFields.style.display = 'none';
        authToggle.innerHTML = "Don't have an account? <span>Sign up</span>";
    }
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (isSignUp) {
        const email = authEmail.value.trim();
        if (users.find(u => u.username === username)) {
            showToast('Username already exists!');
            return;
        }
        
        // Use a random avatar seed
        const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        const newUser = { username, email, password, avatar: newAvatar };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = newUser;
        showToast('Account created successfully!');
    } else {
        // Simple Login Check
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            currentUser = user;
            showToast(`Welcome back, ${username}!`);
        } else if (username === 'premium_user' && password === 'password123') {
            // Hardcoded fallback demo user
            currentUser = { username: 'PremiumUser', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80' };
            showToast('Logged in as demo PremiumUser!');
        } else {
            showToast('Invalid credentials!');
            return;
        }
    }
    
    // Save Auth State
    if (rememberMe.checked) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    // Hide Auth Screen
    document.getElementById('login-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('login-screen').style.display = 'none';
        setupMainApp();
    }, 500);
});

// Profile Dropdown Logic
profileIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== profileIcon) {
        profileDropdown.classList.remove('show');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    window.location.reload(); // Reload to reset state
});

// Particle Background Logic
function initParticles() {
    const canvas = document.getElementById('particles-bg');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedY = Math.random() * -1 - 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.y += this.speedY;
            if (this.y < 0) {
                this.y = canvas.height;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) {
        particlesArray.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function applyTiltEffect(card) {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
}

function renderSkeletons() {
    recentGrid.innerHTML = '';
    songsContainer.innerHTML = '';
    trendingContainer.innerHTML = '';
    const libraryList = document.getElementById('library-list');
    if (libraryList) libraryList.innerHTML = '';
    
    for(let i=0; i<6; i++) {
        recentGrid.innerHTML += `<div class="recent-item skeleton" style="height: 48px;"></div>`;
        songsContainer.innerHTML += `<div class="card skeleton" style="height: 250px;"></div>`;
        trendingContainer.innerHTML += `<div class="card skeleton" style="height: 250px;"></div>`;
        if (libraryList) {
            libraryList.innerHTML += `<div class="lib-item skeleton"><div class="lib-img-container"></div><div class="lib-info"><h4 style="width:100px;height:14px;margin-bottom:4px;"></h4><p style="width:60px;height:12px;"></p></div></div>`;
        }
    }
}

function renderRecent() {
    recentGrid.innerHTML = '';
    const displaySongs = recentlyPlayed.length > 0 ? recentlyPlayed : songs.slice(0, 8);
    
    // Render Center Grid
    displaySongs.slice(0, 8).forEach((song) => {
        const index = songs.findIndex(s => s.url === song.url);
        const recentItem = document.createElement('div');
        recentItem.classList.add('recent-item');
        recentItem.innerHTML = `
            <img src="${song.cover}" alt="Cover">
            <span>${song.title}</span>
        `;
        recentItem.addEventListener('click', () => {
            songIndex = index !== -1 ? index : 0;
            loadSong(songs[songIndex]);
            playSong();
        });
        recentGrid.appendChild(recentItem);
    });

    // Render Left Library List
    const libraryList = document.getElementById('library-list');
    if (libraryList) {
        libraryList.innerHTML = `
            <div class="lib-item">
                <div class="lib-img-container"><i class="fas fa-heart"></i></div>
                <div class="lib-info">
                    <h4>Liked Songs</h4>
                    <p><i class="fas fa-thumbtack" style="color:var(--accent);"></i> Playlist • ${currentUser ? currentUser.username : 'User'}</p>
                </div>
            </div>
        `;
        songs.forEach((song, i) => {
            const libItem = document.createElement('div');
            libItem.classList.add('lib-item');
            if (i % 2 === 0) libItem.classList.add('artist');
            libItem.innerHTML = `
                <div class="lib-img-container"><img src="${song.cover}"></div>
                <div class="lib-info">
                    <h4>${i % 2 === 0 ? song.artist : song.title}</h4>
                    <p>${i % 2 === 0 ? 'Artist' : 'Playlist • Spotify'}</p>
                </div>
            `;
            libItem.addEventListener('click', () => {
                songIndex = i;
                loadSong(songs[songIndex]);
                playSong();
            });
            libraryList.appendChild(libItem);
        });
    }
}

function renderSongs(filterText = '') {
    songsContainer.innerHTML = '';
    trendingContainer.innerHTML = '';
    const artistsContainer = document.getElementById('artists-container');
    const recommendedContainer = document.getElementById('recommended-container');
    
    if(artistsContainer) artistsContainer.innerHTML = '';
    if(recommendedContainer) recommendedContainer.innerHTML = '';

    const filteredSongs = songs.filter(song => 
        song.title.toLowerCase().includes(filterText.toLowerCase()) || 
        song.artist.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filteredSongs.length === 0) {
        songsContainer.innerHTML = '<p style="color:var(--text-secondary);">No results found.</p>';
        return;
    }

    filteredSongs.forEach((song, index) => {
        // Card HTML function
        const createCard = (isArtist = false, prefix = '') => {
            const card = document.createElement('div');
            card.classList.add('card');
            if (isArtist) card.classList.add('artist-card');
            card.innerHTML = `
                <div class="card-img-wrapper" style="position: relative;">
                    <img src="${song.cover}" alt="Cover">
                    <div class="play-btn-card"><i class="fas fa-play" style="margin-left:4px;"></i></div>
                </div>
                <h3>${prefix} ${isArtist ? song.artist : song.title}</h3>
                <p>${isArtist ? 'Artist' : song.artist}</p>
            `;
            applyTiltEffect(card);
            card.addEventListener('click', () => {
                const originalIndex = songs.findIndex(s => s.url === song.url);
                songIndex = originalIndex;
                loadSong(songs[songIndex]);
                playSong();
            });
            return card;
        };

        songsContainer.appendChild(createCard(false, 'Daily Mix'));
        
        if(index % 2 === 0 || index === filteredSongs.length - 1) {
             trendingContainer.appendChild(createCard(false, 'Mix'));
        }
    });
}

// Dynamic Color Extraction
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const hex = "00000".substring(0, 6 - c.length) + c;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${Math.min(r+50, 255)}, ${Math.min(g+50, 255)}, ${Math.min(b+50, 255)}, 0.2)`;
}

function updateDynamicBackground(song) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 100;
        canvas.height = img.height || 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let r=0, g=0, b=0, count=0;
            for(let i=0; i<data.length; i+=40) { // Sample pixels
                if(data[i] < 250 && data[i] > 10) {
                    r += data[i]; g += data[i+1]; b += data[i+2]; count++;
                }
            }
            if(count > 0) {
                const finalColor = `rgba(${Math.floor(r/count)}, ${Math.floor(g/count)}, ${Math.floor(b/count)}, 0.2)`;
                document.documentElement.style.setProperty('--dynamic-color', finalColor);
                document.documentElement.style.setProperty('--accent-glow', finalColor.replace('0.2', '0.4'));
            } else {
                throw new Error("Empty image");
            }
        } catch (e) {
            // Fallback to string hash if CORS fails
            const fbColor = stringToColor(song.title);
            document.documentElement.style.setProperty('--dynamic-color', fbColor);
            document.documentElement.style.setProperty('--accent-glow', fbColor.replace('0.2', '0.4'));
        }
    };
    img.onerror = () => {
        const fbColor = stringToColor(song.title);
        document.documentElement.style.setProperty('--dynamic-color', fbColor);
        document.documentElement.style.setProperty('--accent-glow', fbColor.replace('0.2', '0.4'));
    };
    // Attempt cache bust to force CORS headers
    img.src = song.cover.includes('?') ? song.cover + "&cross=" + new Date().getTime() : song.cover + "?cross=" + new Date().getTime();
}

function loadSong(song, addToRecent = true) {
    updateDynamicBackground(song);
    playbar.classList.add('visible');
    currentTitle.innerText = song.title;
    currentArtist.innerText = song.artist;
    currentCover.src = song.cover;
    audio.src = song.url;
    
    // Update Left Library active state
    document.querySelectorAll('.lib-item').forEach(item => {
        item.classList.remove('active');
        const titleSpan = item.querySelector('h4');
        if (titleSpan && titleSpan.innerText === song.title) {
            item.classList.add('active');
        }
    });

    // Update Right Panel
    const rightCover = document.getElementById('right-cover');
    const rightTitle = document.getElementById('right-title');
    const rightArtist = document.getElementById('right-artist');
    const aboutArtist = document.getElementById('about-artist-name');
    
    if (rightCover) rightCover.src = song.cover;
    if (rightTitle) rightTitle.innerText = song.title;
    if (rightArtist) rightArtist.innerText = song.artist;
    if (aboutArtist) aboutArtist.innerText = song.artist;

    // Update Fullscreen Player
    const fsCover = document.getElementById('fs-cover');
    const fsTitle = document.getElementById('fs-title');
    const fsArtist = document.getElementById('fs-artist');
    if (fsCover) fsCover.src = song.cover;
    if (fsTitle) fsTitle.innerText = song.title;
    if (fsArtist) fsArtist.innerText = song.artist;

    // Update Like button UI
    if (likedSongs.has(song.url)) {
        likeBtn.classList.remove('far');
        likeBtn.classList.add('fas', 'liked');
    } else {
        likeBtn.classList.remove('fas', 'liked');
        likeBtn.classList.add('far');
    }

    if (addToRecent) {
        recentlyPlayed = recentlyPlayed.filter(s => s.url !== song.url);
        recentlyPlayed.unshift(song);
        saveState();
        renderRecent();
    }
}

function playSong() {
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    audio.play();
    const wave = document.getElementById('music-wave');
    if(wave) wave.classList.add('active');
    const fsArt = document.querySelector('.fs-artwork-container');
    if(fsArt) fsArt.classList.add('playing');
}

function pauseSong() {
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    audio.pause();
    const wave = document.getElementById('music-wave');
    if(wave) wave.classList.remove('active');
    const fsArt = document.querySelector('.fs-artwork-container');
    if(fsArt) fsArt.classList.remove('playing');
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) {
        songIndex = songs.length - 1;
    }
    loadSong(songs[songIndex]);
    playSong();
}

function nextSong() {
    if (playQueue.length > 0) {
        songIndex = playQueue.shift();
    } else if (isShuffle) {
        let newIndex = songIndex;
        while(newIndex === songIndex && songs.length > 1) {
            newIndex = Math.floor(Math.random() * songs.length);
        }
        songIndex = newIndex;
    } else {
        songIndex++;
        if (songIndex > songs.length - 1) {
            if (repeatMode === 1) {
                songIndex = 0;
            } else {
                // Stop at end if not repeat all
                songIndex = 0; 
                loadSong(songs[songIndex], false);
                pauseSong();
                return;
            }
        }
    }
    loadSong(songs[songIndex]);
    playSong();
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    
    // Update time displays
    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    currentTimeEl.innerText = formatTime(currentTime);
    totalTimeEl.innerText = formatTime(duration);

    // Update progress bar
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
    }
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
}

function setVolume(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const vol = clickX / width;
    audio.volume = vol;
    volumeBar.style.width = `${vol * 100}%`;
    
    if (vol === 0) {
        muteBtn.classList.replace('fa-volume-up', 'fa-volume-mute');
    } else {
        muteBtn.classList.replace('fa-volume-mute', 'fa-volume-up');
    }
}

function toggleLike() {
    const currentSongUrl = songs[songIndex].url;
    if (likedSongs.has(currentSongUrl)) {
        likedSongs.delete(currentSongUrl);
        likeBtn.classList.remove('fas', 'liked');
        likeBtn.classList.add('far');
    } else {
        likedSongs.add(currentSongUrl);
        likeBtn.classList.remove('far');
        likeBtn.classList.add('fas', 'liked');
    }
    saveState();
}

function toggleMute() {
    if (audio.volume > 0) {
        audio.dataset.savedVolume = audio.volume;
        audio.volume = 0;
        volumeBar.style.width = '0%';
        muteBtn.classList.replace('fa-volume-up', 'fa-volume-mute');
    } else {
        const saved = audio.dataset.savedVolume || 1;
        audio.volume = saved;
        volumeBar.style.width = `${saved * 100}%`;
        muteBtn.classList.replace('fa-volume-mute', 'fa-volume-up');
    }
}

// Event Listeners
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) pauseSong();
    else playSong();
});

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
    if (repeatMode === 2) { // Repeat One
        playSong();
    } else {
        nextSong();
    }
});
progressContainer.addEventListener('click', setProgress);
volumeContainer.addEventListener('click', setVolume);

shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    repeatBtn.classList.remove('active');
    repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
    
    if (repeatMode === 1) { // Repeat All
        repeatBtn.classList.add('active');
    } else if (repeatMode === 2) { // Repeat One
        repeatBtn.classList.add('active');
        repeatBtn.innerHTML = '<div style="position:relative;"><i class="fas fa-redo-alt"></i><span style="position:absolute; font-size:8px; font-weight:bold; top:3px; left:6px; color:#000;">1</span></div>';
    }
});

likeBtn.addEventListener('click', toggleLike);
muteBtn.addEventListener('click', toggleMute);

queueBtn.addEventListener('click', () => {
    // Simple mock queue management - adds random song to queue
    const randomIdx = Math.floor(Math.random() * songs.length);
    playQueue.push(randomIdx);
    queueBtn.classList.add('active');
    setTimeout(() => queueBtn.classList.remove('active'), 200);
    showToast(`Added "${songs[randomIdx].title}" to Queue!`);
});

// Real-time Search
searchInput.addEventListener('input', (e) => {
    renderSongs(e.target.value);
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('themeColor', 'light');
        showToast('Switched to Light Mode');
    } else {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('themeColor', 'dark');
        showToast('Switched to Dark Mode');
    }
});

// Lyrics Modal
lyricsBtn.addEventListener('click', () => {
    lyricsModal.classList.add('show');
    document.getElementById('lyrics-text').innerHTML = `
        <p>Wait for the moment...</p>
        <p>Everything is going to be fine.</p>
        <p>Just listen to the rhythm of <strong>${songs[songIndex].title}</strong></p>
        <br>
        <p>(Mock Lyrics Data)</p>
    `;
});
closeLyrics.addEventListener('click', () => lyricsModal.classList.remove('show'));

// Mini Player
miniPlayerBtn.addEventListener('click', () => {
    document.body.classList.toggle('mini-player');
    if(document.body.classList.contains('mini-player')){
        showToast('Mini Player Active. Press Esc to exit.');
    }
});

// New Layout Buttons Interactivity
document.querySelector('.nav-btn').addEventListener('click', () => {
    const scrollable = document.querySelector('.content-scrollable');
    if (scrollable) scrollable.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelectorAll('.library-chips .chip, .content-chips .chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
        // Remove active class from siblings
        e.target.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        showToast(`Filtered by: ${e.target.innerText}`);
    });
});

const rightPanel = document.querySelector('.right-panel');
const rightCloseBtn = document.querySelector('.right-header-actions .fa-times');
if (rightCloseBtn) {
    rightCloseBtn.addEventListener('click', () => {
        rightPanel.style.display = 'none';
    });
}

const followBtn = document.querySelector('.follow-btn');
if (followBtn) {
    followBtn.addEventListener('click', (e) => {
        if (e.target.innerText === 'Follow') {
            e.target.innerText = 'Following';
            e.target.style.background = 'white';
            e.target.style.color = 'black';
            showToast('You are now following ' + document.getElementById('about-artist-name').innerText);
        } else {
            e.target.innerText = 'Follow';
            e.target.style.background = 'transparent';
            e.target.style.color = 'white';
            showToast('Unfollowed ' + document.getElementById('about-artist-name').innerText);
        }
    });
}

const nowPlayingPlaybar = document.getElementById('now-playing');
if (nowPlayingPlaybar) {
    nowPlayingPlaybar.style.cursor = 'pointer';
    nowPlayingPlaybar.addEventListener('click', () => {
        rightPanel.style.display = 'flex';
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if typing in search
    if (document.activeElement === searchInput) return;
    
    if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) pauseSong();
        else playSong();
    } else if (e.code === 'ArrowRight') {
        nextSong();
    } else if (e.code === 'ArrowLeft') {
        prevSong();
    } else if (e.code === 'Escape' && document.body.classList.contains('mini-player')) {
        document.body.classList.remove('mini-player');
    }
});

// Toast Function
function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Theme Modal
const themeModal = document.getElementById('theme-modal');
document.getElementById('theme-panel-btn').addEventListener('click', () => themeModal.classList.add('show'));
document.getElementById('close-theme').addEventListener('click', () => themeModal.classList.remove('show'));

document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-glow', color + '80');
        localStorage.setItem('customAccent', color);
        themeModal.classList.remove('show');
        showToast('Theme Color Updated!');
    });
});

// Visualizer Initialization
function initVisualizer() {
    if (isVisualizerInitialized) return;
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    canvasCtx = visualizerCanvas.getContext('2d');
    
    visualizerCanvas.style.opacity = '1';
    isVisualizerInitialized = true;
    drawVisualizer();
}

function drawVisualizer() {
    if(!isPlaying) return requestAnimationFrame(drawVisualizer);
    
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    const barWidth = (visualizerCanvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;
    
    let sum = 0;
    
    for(let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 4;
        sum += dataArray[i];
        
        // Use custom accent color if available, otherwise fallback
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1db954';
        canvasCtx.fillStyle = accent;
        canvasCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
    
    // Beat Sync Animation for Right Panel Cover Image
    const average = sum / dataArray.length;
    if (rightCoverAnim) {
        if (average > 80) { // Threshold for a "beat"
            const scale = 1 + (average / 255) * 0.15; // Max scale of 1.15
            rightCoverAnim.style.transform = `scale(${scale})`;
            rightCoverAnim.style.transition = 'transform 0.05s ease';
        } else {
            rightCoverAnim.style.transform = 'scale(1)';
            rightCoverAnim.style.transition = 'transform 0.2s ease';
        }
    }
}

// Override play to init audio context (needs user interaction)
const originalPlay = playSong;
playSong = function() {
    if (!isVisualizerInitialized) {
        try { initVisualizer(); } catch(e) { console.warn("Visualizer failed to start", e); }
    }
    originalPlay();
};

// Dynamic Time Greeting & UI Enhancements
const hour = new Date().getHours();
const greetingText = document.getElementById('greeting-text');
if (greetingText) {
    if (hour < 12) greetingText.innerText = "Good morning";
    else if (hour < 18) greetingText.innerText = "Good afternoon";
    else greetingText.innerText = "Good evening";
}

const mainScroll = document.getElementById('main-scroll');
const globalTopbar = document.querySelector('.global-topbar');
if (mainScroll && globalTopbar) {
    mainScroll.addEventListener('scroll', () => {
        if (mainScroll.scrollTop > 20) globalTopbar.classList.add('scrolled');
        else globalTopbar.classList.remove('scrolled');
    });
}

// Fullscreen Player Controls
const fsPlayer = document.getElementById('fullscreen-player');
const fsClose = document.getElementById('fs-close');
const currentCoverImg = document.getElementById('current-cover');

if (fsPlayer && fsClose && currentCoverImg) {
    currentCoverImg.style.cursor = 'pointer';
    currentCoverImg.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent right panel toggle if attached
        fsPlayer.classList.add('show');
    });
    fsClose.addEventListener('click', () => fsPlayer.classList.remove('show'));
}

// ====== COMPREHENSIVE BUTTON FUNCTIONALITY ======

// 1. Navigation & Search
if (homeBtn) {
    homeBtn.addEventListener('click', () => {
        // Clear search and restore home
        if (searchInput) searchInput.value = '';
        clearSearchResults();
        const ms = document.getElementById('main-scroll');
        if (ms) ms.scrollTo({top: 0, behavior: 'smooth'});
    });
}

function clearSearchResults() {
    const existing = document.getElementById('search-results-section');
    if (existing) existing.remove();
    // Show original sections
    document.querySelectorAll('.playlist-section, .recent-grid-2col, .greeting-section, .hero-banner, .content-chips').forEach(el => {
        el.style.display = '';
    });
}

function renderSearchResults(query) {
    // Hide original home content
    document.querySelectorAll('.playlist-section, .recent-grid-2col, .greeting-section, .hero-banner').forEach(el => {
        el.style.display = 'none';
    });

    // Remove old results
    const existing = document.getElementById('search-results-section');
    if (existing) existing.remove();

    const ms = document.getElementById('main-scroll');
    if (!ms) return;

    // Filter songs
    const results = songs.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query)
    );

    const section = document.createElement('div');
    section.id = 'search-results-section';
    section.style.padding = '0 0 24px 0';

    if (results.length === 0) {
        section.innerHTML = `
            <div style="text-align:center; padding: 80px 20px; color: #b3b3b3;">
                <i class="fas fa-search" style="font-size:48px; margin-bottom:16px; display:block; opacity:0.3;"></i>
                <h2 style="color:white; margin-bottom:8px;">No results for "${query}"</h2>
                <p>Try different keywords or check the spelling.</p>
            </div>`;
    } else {
        section.innerHTML = `<h2 style="margin-bottom:20px;">Results for "${query}"</h2>`;
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap:20px;';

        results.forEach(song => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-img-wrapper" style="position:relative;">
                    <img src="${song.cover}" alt="Cover">
                    <div class="play-btn-card"><i class="fas fa-play" style="margin-left:4px;"></i></div>
                </div>
                <h3>${song.title}</h3>
                <p>${song.artist}</p>`;
            card.addEventListener('click', () => {
                songIndex = songs.findIndex(s => s.url === song.url);
                loadSong(songs[songIndex]);
                playSong();
            });
            applyTiltEffect(card);
            grid.appendChild(card);
        });
        section.appendChild(grid);
    }

    // Insert after content-chips
    const chips = document.querySelector('.content-chips');
    if (chips) chips.after(section);
    else ms.appendChild(section);
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length === 0) {
            clearSearchResults();
        } else {
            renderSearchResults(query);
        }
    });
    // Press Escape to clear search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            clearSearchResults();
            searchInput.blur();
        }
    });
}

// 2. Topbar & Library Actions
document.querySelector('.topbar-right .fa-bell')?.addEventListener('click', () => showToast("No new notifications"));
document.querySelector('.library-actions .fa-plus')?.addEventListener('click', () => showToast("Create new playlist"));
document.querySelector('.library-actions .fa-arrow-right')?.addEventListener('click', () => showToast("Expand library"));
document.querySelector('.fa-laptop-house')?.addEventListener('click', () => showToast("No devices found nearby"));
document.getElementById('lyrics-btn')?.addEventListener('click', () => showToast("Lyrics not available for this track"));
document.getElementById('queue-btn')?.addEventListener('click', () => showToast("Queue is currently empty"));
document.querySelector('.fs-header .fa-ellipsis-h')?.addEventListener('click', () => showToast("Options menu opened"));
document.querySelector('.topbar-left .fa-ellipsis-h')?.addEventListener('click', () => showToast("Menu"));

// 3. Hero Banner Actions
const heroPlayBtn = document.querySelector('.hero-play-btn');
const heroSaveBtn = document.querySelector('.hero-save-btn');
if (heroPlayBtn) {
    heroPlayBtn.addEventListener('click', () => {
        if (!isPlaying) {
            if (audio.src === "") loadSong(songs[0]);
            playSong();
        } else {
            pauseSong();
        }
    });
}
if (heroSaveBtn) {
    heroSaveBtn.addEventListener('click', (e) => {
        const icon = e.currentTarget.querySelector('i');
        if (icon.classList.contains('far')) {
            icon.classList.replace('far', 'fas');
            icon.style.color = 'var(--accent)';
            showToast("Added to Your Library");
        } else {
            icon.classList.replace('fas', 'far');
            icon.style.color = 'white';
            showToast("Removed from Your Library");
        }
    });
}

// 4. Advanced Player Controls (Shuffle, Repeat, Mute, Fullscreen)

if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        showToast(isShuffle ? "Shuffle On" : "Shuffle Off");
    });
}

if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
        audio.loop = isRepeat;
        showToast(isRepeat ? "Repeat Track On" : "Repeat Track Off");
    });
}

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            previousVolume = audio.volume;
            audio.volume = 0;
            if(volumeBar) volumeBar.style.width = '0%';
            muteBtn.classList.replace('fa-volume-up', 'fa-volume-mute');
        } else {
            audio.volume = previousVolume || 0.5;
            if(volumeBar) volumeBar.style.width = (audio.volume * 100) + '%';
            muteBtn.classList.replace('fa-volume-mute', 'fa-volume-up');
        }
    });
}

if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        const fp = document.getElementById('fullscreen-player');
        if (!fp) return;
        if (fp.classList.contains('show')) {
            fp.classList.remove('show');
            fullscreenBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            fullscreenBtn.title = 'Open Full Player';
        } else {
            // Make sure song info is up to date before opening
            const fsCover = document.getElementById('fs-cover');
            const fsTitle = document.getElementById('fs-title');
            const fsArtist = document.getElementById('fs-artist');
            const currentSong = songs[songIndex];
            if (currentSong) {
                if (fsCover) fsCover.src = currentSong.cover;
                if (fsTitle) fsTitle.innerText = currentSong.title;
                if (fsArtist) fsArtist.innerText = currentSong.artist;
            }
            fp.classList.add('show');
            fullscreenBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
            fullscreenBtn.title = 'Close Full Player';
        }
    });
}

// Also close fullscreen player with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const fp = document.getElementById('fullscreen-player');
        if (fp && fp.classList.contains('show')) {
            fp.classList.remove('show');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
                fullscreenBtn.title = 'Open Full Player';
            }
        }
    }
});

// Handle automatic next song on track end
audio.addEventListener('ended', () => {
    if (!isRepeat) {
        if (isShuffle) {
            songIndex = Math.floor(Math.random() * songs.length);
            loadSong(songs[songIndex]);
            playSong();
        } else {
            nextSong();
        }
    }
});

// ====== REMAINING UI BUTTONS ======

// Right Panel: Close and Ellipsis
document.querySelectorAll('.right-header-actions i').forEach(icon => {
    icon.style.cursor = 'pointer';
    icon.addEventListener('click', function() {
        if (this.classList.contains('fa-times')) {
            const rp = document.querySelector('.right-panel');
            if (rp) { rp.style.display = rp.style.display === 'none' ? '' : 'none'; }
        } else {
            showToast('More options');
        }
    });
});

// Library filter chips — filter cards by clicking
document.querySelectorAll('.library-chips .chip').forEach(chip => {
    chip.addEventListener('click', function() {
        document.querySelectorAll('.library-chips .chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        showToast(`Showing: ${this.innerText}`);
    });
});

// Center content chips (All / Music / Podcasts)
document.querySelectorAll('.content-chips .chip').forEach(chip => {
    chip.addEventListener('click', function() {
        document.querySelectorAll('.content-chips .chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        if (this.innerText === 'Podcasts') {
            showToast('No podcasts available');
        }
    });
});

// "Show all" links
document.querySelectorAll('.show-all').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => showToast('Showing all tracks'));
});

// Liked Songs library item
const likedSongsItem = document.querySelector('.lib-item');
if (likedSongsItem) {
    likedSongsItem.style.cursor = 'pointer';
    likedSongsItem.addEventListener('click', () => {
        const liked = songs.filter(s => likedSongs.has(s.url));
        if (liked.length === 0) {
            showToast('No liked songs yet — heart a song first!');
        } else {
            songIndex = songs.findIndex(s => s.url === liked[0].url);
            loadSong(songs[songIndex]);
            playSong();
            showToast(`Playing ${liked.length} liked songs`);
        }
    });
}

// Library search icon
document.querySelector('.library-search-row .fa-search')?.addEventListener('click', () => {
    showToast('Type in the main search bar to filter');
});

// Account dropdown items
document.querySelector('#profile-dropdown .fa-external-link-alt')?.parentElement?.addEventListener('click', () => {
    showToast('Account settings (requires Spotify account)');
});
document.querySelector('#profile-dropdown .fa-cog')?.parentElement?.addEventListener('click', () => {
    showToast('Settings panel coming soon');
});

// Play-pause keyboard spacebar shortcut enhancement
document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) pauseSong(); else playSong();
    }
    if (e.code === 'ArrowRight') nextSong();
    if (e.code === 'ArrowLeft') prevSong();
    if (e.code === 'KeyM') muteBtn?.click();
});

// Start
init();

