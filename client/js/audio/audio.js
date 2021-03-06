define(['../map/area'], function(Area) {
    var AudioManager = Class.extend({
        init: function(game) {
            this.game = game;
            this.enabled = game.app.storage.getSettings().musicOn;
            this.extension = "mp3";
            this.sounds = {};
            this.currentMusic = null;
            this.areas = [];
            this.loadedMusic = {
                "ancientcavern": false,
                "beach": false,
                "darkestregion": false,
                "exploration": false,
                "farawaycity": false,
                "gameover": false,
                "icebeach": false,
                "royalcity": false,
                "icetown": false,
                "peacefultown": false,
                "thebattle": false,
                "theconclusion": false,
                "unknowing": false,
                "mysterio": false,
                "royalpalace": false,
                "darkcavern": false,
                "dungeon": false,
                "underthesea": false,
                "deepunderthesea": false,
                "campusmap": false,
                "cornfields": false,
                "desert": false,
                "lostland": false,
                "sketchyland": false,
                "volcano": false,
                "meadowofthepast": false,
                "sililoquy": false,
                "veloma": false,
                "boss": false,
                "cave": false,
                "dangerouscave": false
            };
            this.loadedSound = {
                "loot":false,
                "hit1":false,
                "hit2":false,
                "hurt":false,
                "heal":false,
                "chat":false,
                "revive":false,
                "death":false,
                "firefox":false,
                "achievement":false,
                "kill1":false,
                "kill2":false,
                "noloot":false,
                "teleport":false,
                "chest":false,
                "npc":false,
                "npc-end":false
            };

            if ( this.enabled ) {
                $('#soundbutton').attr('class', '');
                this.switchDisabled = false;
            } else {
                $('#soundbutton').attr('class', 'active');
                this.switchDisabled = true;
            }
        },
        //Functions to individually set the music state
        setOn: function() {
            this.enabled = true;
            if (this.currentMusic)
                this.currentMusic = null;

            this.updateMusic();
        },

        setOff: function() {
            this.enabled = false;
            if (this.currentMusic)
                this.resetMusic(this.currentMusic);
        },

        toggle: function() {
            if(this.enabled) {
                this.enabled = false;
                this.switchDisabled = true;
                if(this.currentMusic) {
                    this.resetMusic(this.currentMusic);
                }
            } else {
                this.enabled = true;
                this.switchDisabled = false;
                if(this.currentMusic) {
                    this.currentMusic = null;
                }
                this.updateMusic();
            }

            this.game.app.storage.getSettings().musicOn = this.enabled;
            this.game.app.storage.save();
            return this.enabled;
        },
        load: function (basePath, name, loaded_callback, channels) {
            var path = basePath + name + "." + this.extension,
                sound = document.createElement('audio'),
                self = this;

            sound.addEventListener('canplaythrough', function (e) {
                this.removeEventListener('canplaythrough', arguments.callee, false);
                log.debug(path + " is ready to play.");
                if(loaded_callback) {
                    loaded_callback();
                }
            }, false);
            sound.addEventListener('error', function (e) {
                log.error("Error: "+ path +" could not be loaded.");
                self.sounds[name] = null;
            }, false);

            sound.preload = "auto";
            sound.autobuffer = true;
            sound.src = path;
            sound.load();

            this.sounds[name] = [sound];
            _.times(channels - 1, function() {
                self.sounds[name].push(sound.cloneNode(true));
            });
        },
        loadSound: function(name, handleLoaded) {
            this.load("audio/sounds/", name, handleLoaded, 4);
        },
        loadMusic: function(name, handleLoaded, preventLoop) {
            this.load("audio/music/", name, handleLoaded, 1);
            var music = this.sounds[name][0];
            music.loop = true;
            music.addEventListener('ended', function() { music.play() }, false);
        },

        getSound: function(name) {
            if(!this.sounds[name]) {
                return null;
            }
            var sound = _.detect(this.sounds[name], function(sound) {
                return sound.ended || sound.paused;
            });
            if(sound && sound.ended) {
                sound.currentTime = 0;
            } else {
                sound = this.sounds[name][0];
            }
            return sound;
        },
        playSound: function(name) {
            if (this.enabled)
            {
                if (name in this.loadedSound &&
                    this.loadedSound[name] == false)
                {
                    this.loadSound(name);
                    this.loadedSound[name] = true;
                }
                var sound = this.getSound(name);
                if(sound) {
                    sound.volume = 0.60;
                    sound.play();
                }
            }
        },
        addArea: function(x, y, width, height, musicName) {
            var area = new Area(x, y, width, height);
            area.musicName = musicName;
            this.areas.push(area);
        },
        getSurroundingMusic: function(entity) {
            var music = null,
                area = _.detect(this.areas, function(area) {
                    return area.contains(entity);
                });

            if(area) {
                music = { sound: this.getSound(area.musicName), name: area.musicName };
            }
            return music;
        },
        updateMusic: function() {
            if(this.enabled) {
                var music = this.getSurroundingMusic(this.game.player);

                if(music) {
                    if (this.game.renderer.mobile) {
                        if (!this.isCurrentMusic(music)) {
                            this.resetMusic(this.currentMusic);
                            if (music.name in this.loadedMusic &&
                                this.loadedMusic[music.name] == false)
                            {
                                this.loadMusic(music.name);
                                this.loadedMusic[music.name] = true;
                            }
                            this.playMusic(music);
                        }
                    } else {
                        if(!this.isCurrentMusic(music)) {
                            if(this.currentMusic) {
                                this.fadeOutCurrentMusic();
                            }
                            if (music.name in this.loadedMusic &&
                                this.loadedMusic[music.name] == false)
                            {
                                this.loadMusic(music.name);
                                this.loadedMusic[music.name] = true;
                            }
                            this.playMusic(music);
                        }
                    }
                } else {
                    if (this.game.renderer.mobile)
                        this.resetMusic(this.currentMusic);
                    else
                        this.fadeOutCurrentMusic();
                }
            }
        },
        isCurrentMusic: function(music) {
            return this.currentMusic && (music.name === this.currentMusic.name);
        },
        playMusic: function(music) {
            if(this.enabled && music && music.sound) {
                if(music.sound.fadingOut) {
                    this.fadeInMusic(music);
                } else {
                    music.sound.volume = 0.5;
                    music.sound.play();
                }
                this.currentMusic = music;
            }
        },
        resetMusic: function(music) {
            if(music && music.sound && music.sound.readyState > 0) {
                music.sound.pause();
                music.sound.currentTime = 0;
            }
        },
        fadeOutMusic: function(music, ended_callback) {
            var self = this;
            if(music && !music.sound.fadingOut) {
                this.clearFadeIn(music);
                music.sound.fadingOut = setInterval(function() {
                    var step = 0.02;
                    volume = music.sound.volume - step;

                    if(self.enabled && volume >= step) {
                        music.sound.volume = volume;
                    } else {
                        music.sound.volume = 0;
                        self.clearFadeOut(music);
                        ended_callback(music);
                    }
                }, 100);
            }
        },
        fadeInMusic: function(music) {
            var self = this;
            if(music && !music.sound.fadingIn) {
                this.clearFadeOut(music);
                music.sound.fadingIn = setInterval(function() {
                    var step = 0.1;
                    volume = music.sound.volume + step;

                    if(self.enabled && volume < 1 - step) {
                        music.sound.volume = volume;
                    } else {
                        music.sound.volume = 1;
                        self.clearFadeIn(music);
                    }
                }, 300);
            }
        },
        clearFadeOut: function(music) {
            if(music.sound.fadingOut) {
                clearInterval(music.sound.fadingOut);
                music.sound.fadingOut = null;
            }
        },
        clearFadeIn: function(music) {
            if(music.sound.fadingIn) {
                clearInterval(music.sound.fadingIn);
                music.sound.fadingIn = null;
            }
        },
        fadeOutCurrentMusic : function() {
            var self = this;
            if(this.currentMusic) {
                this.fadeOutMusic(this.currentMusic, function(music) {
                    self.resetMusic(music);
                });
                this.currentMusic = null;
            }
        }
    });

    return AudioManager;
});
