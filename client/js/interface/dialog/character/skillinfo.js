/**
 * Created by flavius on 2017-02-24.
 */
define(['../../../data/skilldata'], function(SkillData) {

    /**
     * To be done:
     * We are loosely handling the levels[] array.
     * Instead of creating a CSS instance for each level
     * we might as well do it all at once, and not needlessly
     * push into an array.
     */

    var SkillInfo = Class.extend({
        init: function(id, name, position, game) {
            var self = this;

            self.id = id;
            self.name = name;
            self.game = game;
            self.position = position;
            self.background = $(id);
            self.body = $(id + 'Body');
            self.levels = [];
            self.level = 0;
            self.cooldown = false;
            self.scale = self.game.getScaleFactor();

            self.loadCSSData();
        },

        loadCSSData: function() {
            var self = this,
                levelPosition = [
                    ["-329px -278px"],
                    ["-658px -556px"],
                    ["-987px -834px"]
                ],
                dragStart = false,
                isActive = SkillData.Names[self.name].type == 'active';

            self.body.css({
                'position': 'absolute',
                'left': '0px',
                'top': '0px',
                'width': 16 * self.scale,
                'height': 15 * self.scale,
                'display': 'none'
            });

            if (self.position) {
                self.body.css({
                    'background-image': 'url("img/' + self.scale + '/skillicons.png")',
                    'background-position': self.position,
                    'display': 'block'
                });
            }

            for (var i = 0; i < 4; i++) {
                var level = $(self.id + 'Level' + (i + 1));

                level.css({
                    'position': 'absolute',
                    'left': (19 + (i * 6)) * self.scale + 'px',
                    'top': 9 * self.scale,
                    'width': 5 * self.scale,
                    'height': 8 * self.scale,
                    'background-image': 'url("img/' + self.scale + '/main.png")',
                    'background-position': levelPosition[self.scale - 1],
                    'display': 'none'
                });

                self.levels.push(level);
            }

            if (isActive) {
                self.body.bind('dragstart', function(event) {
                    event.originalEvent.dataTransfer.setData('skillName', self.name);

                    DragData = {};
                    DragData.skillName = self.name;
                    dragStart = true;
                });

                self.body.bind('mouseup', function(event) {
                    if (!dragStart && !self.game.player.skillHandler.containsSkill(self.name) && !self.cooldown) {
                        self.cooldown = true;
                        self.game.client.sendSkillInstall(self.game.selectedSkillIndex++ % 5, self.name);

                        setTimeout(function() {
                            self.cooldown = false;
                        }, 1000)
                    }
                    dragStart = true;
                });
            }
        },

        getName: function() {
            return this.name;
        },

        getLevel: function() {
            return this.level;
        },

        setLevel: function(level) {
            var self = this;

            self.level = level;

            for (var i = 0; i < 4; i++)
                self.levels[i].css('display', 'none');

            for (var id = 0; id < self.level; id++)
                self.levels[id].css('display', 'block');
        }
    });

    return SkillInfo;
});