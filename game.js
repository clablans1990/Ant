const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;
const TABLE_Y = 822;

const inputState = {
  left: false,
  right: false,
  jumpQueued: false,
};

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#97e0ff',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1450 },
      debug: false,
    },
  },
  fps: { target: 60, forceSetTimeOut: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    create,
    update,
  },
};

new Phaser.Game(config);

function create() {
  this.state = {
    score: 0,
    elapsed: 0,
    crumbs: 0,
    gameOver: false,
    attackDelay: 2300,
    attackSpeed: 1,
    fingerCount: 1,
  };

  buildBackground.call(this);
  buildWorld.call(this);
  buildAnt.call(this);
  buildFingerPool.call(this);
  buildCrumbs.call(this);
  buildUi.call(this);
  initControls.call(this);
  initAudio.call(this);

  this.physics.add.collider(this.ant, this.ground);
  this.physics.add.collider(this.ant, this.platforms);
  this.physics.add.overlap(this.ant, this.crumbs, collectCrumb, null, this);

  this.attackLoop = this.time.addEvent({
    delay: this.state.attackDelay,
    loop: true,
    callback: triggerFingerAttack,
    callbackScope: this,
  });

  this.diffLoop = this.time.addEvent({
    delay: 8000,
    loop: true,
    callback: increaseDifficulty,
    callbackScope: this,
  });
}

function buildBackground() {
  this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x97e0ff).setDepth(-20);
  this.add.circle(440, 120, 90, 0xffffff, 0.6).setDepth(-19);

  this.add.rectangle(GAME_WIDTH / 2, 720, GAME_WIDTH + 80, 430, 0xe8ba85).setAngle(-1).setDepth(-8);
  this.add.rectangle(GAME_WIDTH / 2, 786, GAME_WIDTH + 80, 330, 0xd39a59).setDepth(-7);

  for (let i = 0; i < 22; i += 1) {
    this.add.circle(Phaser.Math.Between(8, GAME_WIDTH - 8), Phaser.Math.Between(760, 860), Phaser.Math.Between(2, 6), 0xbd8f5f, 0.35).setDepth(-6);
  }
}

function buildWorld() {
  this.ground = this.physics.add.staticImage(GAME_WIDTH / 2, TABLE_Y + 45, null)
    .setDisplaySize(GAME_WIDTH + 80, 95)
    .refreshBody()
    .setVisible(false);

  this.platforms = this.physics.add.staticGroup();

  const plate = this.add.ellipse(124, 770, 168, 38, 0xffffff).setStrokeStyle(3, 0xd8e3ef, 1).setDepth(-5);
  this.physics.add.existing(plate, true);
  this.platforms.add(plate);

  const cup = this.add.rectangle(410, 700, 92, 180, 0xfff7f2).setDepth(-5);
  this.add.rectangle(410, 620, 118, 20, 0xff89a8).setDepth(-5);
  this.physics.add.existing(cup, true);
  this.platforms.add(cup);

  const spoon = this.add.rectangle(274, 742, 132, 18, 0xe9f0f5).setAngle(-14).setDepth(-5);
  this.physics.add.existing(spoon, true);
  this.platforms.add(spoon);
}

function buildAnt() {
  this.ant = this.add.container(72, TABLE_Y - 34);
  const segments = [
    this.add.ellipse(-16, 0, 23, 18, 0x3a2818),
    this.add.ellipse(0, 0, 34, 24, 0x291a10),
    this.add.ellipse(18, 0, 20, 16, 0x3a2818),
  ];
  const eyes = [
    this.add.circle(-19, -4, 3, 0xffffff),
    this.add.circle(-13, -4, 3, 0xffffff),
  ];
  const pupils = [
    this.add.circle(-19, -4, 1.2, 0x000000),
    this.add.circle(-13, -4, 1.2, 0x000000),
  ];

  this.legs = [];
  for (let i = 0; i < 3; i += 1) {
    const y = i * 6 - 7;
    const legL = this.add.rectangle(-3, y, 12, 2, 0x1a120b).setOrigin(1, 0.5);
    const legR = this.add.rectangle(3, y, 12, 2, 0x1a120b).setOrigin(0, 0.5);
    this.legs.push([legL, legR]);
  }

  this.ant.add([...segments, ...eyes, ...pupils, ...this.legs.flat()]);
  this.physics.add.existing(this.ant);
  this.ant.body.setSize(34, 24).setOffset(-17, -12);
  this.ant.body.setCollideWorldBounds(true);
  this.ant.body.setMaxVelocity(340, 1020);
  this.ant.body.setDragX(1300);
}

function buildFingerPool() {
  this.fingers = [];
  for (let i = 0; i < 3; i += 1) {
    const root = this.add.container(0, -220).setVisible(false).setDepth(8);
    const finger = this.add.rectangle(0, 0, 78, 172, 0xffd7c8).setStrokeStyle(4, 0xedb7a7, 0.9);
    const knuckle = this.add.ellipse(0, 44, 62, 44, 0xf8c8b7, 0.9);
    const nail = this.add.rectangle(0, -64, 56, 42, 0xfbfcff).setStrokeStyle(2, 0xe8e8ff, 1);
    const shadow = this.add.ellipse(0, TABLE_Y - 20, 90, 24, 0x000000, 0.18).setVisible(false).setDepth(2);
    const warning = this.add.circle(0, TABLE_Y - 24, 8, 0xff5261).setVisible(false).setDepth(3);
    root.add([finger, knuckle, nail]);
    this.fingers.push({ root, shadow, warning });
  }
}

function buildCrumbs() {
  this.crumbs = this.physics.add.group({ allowGravity: false, immovable: true });
  for (let i = 0; i < 7; i += 1) {
    spawnCrumb.call(this);
  }
}

function spawnCrumb() {
  const crumb = this.add.circle(
    Phaser.Math.Between(24, GAME_WIDTH - 24),
    Phaser.Math.Between(705, 790),
    Phaser.Math.Between(6, 9),
    0xffdf75,
  ).setStrokeStyle(2, 0xe2b95c, 1);
  this.physics.add.existing(crumb);
  crumb.body.setCircle(8);
  crumb.body.setAllowGravity(false);
  this.crumbs.add(crumb);
}

function buildUi() {
  this.add.rectangle(GAME_WIDTH / 2, 44, GAME_WIDTH - 20, 72, 0x11283a, 0.58).setStrokeStyle(2, 0xffffff, 0.4);

  this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '26px', fontStyle: 'bold' });
  this.timerText = this.add.text(355, 20, 'Time: 0.0', { fontSize: '26px', fontStyle: 'bold' });

  this.tipText = this.add.text(GAME_WIDTH / 2, 96, 'Grab crumbs + dodge finger slams!', {
    fontSize: '22px',
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: { left: 8, right: 8, top: 3, bottom: 3 },
  }).setOrigin(0.5);

  this.time.delayedCall(2400, () => {
    this.tweens.add({ targets: this.tipText, alpha: 0, duration: 500, onComplete: () => this.tipText.destroy() });
  });

  this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
    fontSize: '52px',
    align: 'center',
    fontStyle: 'bold',
  }).setOrigin(0.5).setVisible(false);

  this.restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'RESTART', {
    fontSize: '40px',
    fontStyle: 'bold',
    backgroundColor: '#19415f',
    padding: { left: 20, right: 20, top: 10, bottom: 10 },
  }).setOrigin(0.5).setInteractive().setVisible(false);

  this.restartText.on('pointerdown', () => this.scene.restart());
}

function initControls() {
  const bindHold = (id, key) => {
    const btn = document.getElementById(id);
    const setValue = (pressed) => {
      inputState[key] = pressed;
      btn.classList.toggle('pressed', pressed);
    };
    btn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      setValue(true);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
      btn.addEventListener(eventName, () => setValue(false));
    });
  };

  bindHold('btn-left', 'left');
  bindHold('btn-right', 'right');

  const jumpBtn = document.getElementById('btn-jump');
  jumpBtn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    jumpBtn.classList.add('pressed');
    inputState.jumpQueued = true;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
    jumpBtn.addEventListener(eventName, () => jumpBtn.classList.remove('pressed'));
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function initAudio() {
  this.sfx = {
    slam: () => synthSfx.call(this, { type: 'triangle', freq: 110, duration: 0.16, volume: 0.2, sweep: -35 }),
    splat: () => synthSfx.call(this, { type: 'square', freq: 180, duration: 0.18, volume: 0.17, sweep: -50 }),
    laugh: () => {
      synthSfx.call(this, { type: 'sine', freq: 320, duration: 0.12, volume: 0.11, sweep: 40 });
      this.time.delayedCall(90, () => synthSfx.call(this, { type: 'sine', freq: 390, duration: 0.16, volume: 0.1, sweep: 25 }));
    },
  };
}

function update(_, deltaMs) {
  if (this.state.gameOver) {
    return;
  }

  const delta = deltaMs / 1000;
  this.state.elapsed += delta;
  this.state.score += 7 * delta;

  const movingLeft = inputState.left || this.cursors.left.isDown;
  const movingRight = inputState.right || this.cursors.right.isDown;
  const jumpPressed = inputState.jumpQueued || Phaser.Input.Keyboard.JustDown(this.cursors.up);

  if (movingLeft) {
    this.ant.body.setVelocityX(-220);
    this.ant.scaleX = -1;
  } else if (movingRight) {
    this.ant.body.setVelocityX(220);
    this.ant.scaleX = 1;
  }

  if (jumpPressed && this.ant.body.blocked.down) {
    this.ant.body.setVelocityY(-640);
    this.tweens.add({ targets: this.ant, scaleY: 0.78, yoyo: true, duration: 120 });
  }
  inputState.jumpQueued = false;

  const walkSpeed = Math.abs(this.ant.body.velocity.x);
  if (walkSpeed > 30 && this.ant.body.blocked.down) {
    const stride = Math.sin(this.time.now * 0.03) * 28;
    this.legs.forEach(([legL, legR], index) => {
      const amp = (index + 1) * 0.04;
      legL.rotation = stride * amp * 0.02;
      legR.rotation = -stride * amp * 0.02;
    });
  }

  this.scoreText.setText(`Score: ${Math.floor(this.state.score)}`);
  this.timerText.setText(`Time: ${this.state.elapsed.toFixed(1)}`);
}

function triggerFingerAttack() {
  if (this.state.gameOver) {
    return;
  }

  const attackerCount = Phaser.Math.Clamp(this.state.fingerCount, 1, this.fingers.length);
  const targets = [Phaser.Math.Clamp(this.ant.x + Phaser.Math.Between(-20, 20), 42, GAME_WIDTH - 42)];
  while (targets.length < attackerCount) {
    targets.push(Phaser.Math.Between(50, GAME_WIDTH - 50));
  }

  for (let i = 0; i < attackerCount; i += 1) {
    const fingerObj = this.fingers[i];
    launchFinger.call(this, fingerObj, targets[i], i * 110);
  }
}

function launchFinger(fingerObj, x, delay) {
  const { root, shadow, warning } = fingerObj;
  root.setVisible(true).setPosition(x, -210);
  shadow.setVisible(true).setPosition(x, TABLE_Y - 20).setScale(0.5, 0.65).setAlpha(0.1);
  warning.setVisible(true).setPosition(x, TABLE_Y - 25).setScale(0.5).setAlpha(0.9);

  this.tweens.add({
    targets: [shadow, warning],
    scaleX: 1,
    duration: 350 / this.state.attackSpeed,
    delay,
  });

  this.tweens.add({
    targets: warning,
    alpha: 0.2,
    yoyo: true,
    repeat: 1,
    duration: 120 / this.state.attackSpeed,
    delay,
  });

  this.tweens.add({
    targets: root,
    y: 180,
    duration: 330 / this.state.attackSpeed,
    ease: 'Sine.out',
    delay,
    onComplete: () => {
      warning.setVisible(false);
      this.tweens.add({
        targets: root,
        y: TABLE_Y - 56,
        duration: 120 / this.state.attackSpeed,
        ease: 'Cubic.in',
        onStart: () => {
          playSound.call(this, this.sfx.slam);
          createImpact.call(this, x, TABLE_Y - 42);
          this.cameras.main.shake(130, 0.011 * this.state.attackSpeed);
          detectHit.call(this, x);
        },
        onComplete: () => {
          this.tweens.add({
            targets: [root, shadow],
            y: -210,
            alpha: 0,
            duration: 240 / this.state.attackSpeed,
            ease: 'Sine.in',
            onComplete: () => {
              root.setVisible(false).setAlpha(1);
              shadow.setVisible(false).setAlpha(1);
            },
          });
        },
      });
    },
  });
}

function createImpact(x, y) {
  for (let i = 0; i < 14; i += 1) {
    const dust = this.add.circle(x + Phaser.Math.Between(-26, 26), y + Phaser.Math.Between(-8, 8), Phaser.Math.Between(3, 8), 0xe6d3bb, 0.9);
    this.tweens.add({
      targets: dust,
      x: dust.x + Phaser.Math.Between(-60, 60),
      y: dust.y + Phaser.Math.Between(-25, 30),
      alpha: 0,
      duration: Phaser.Math.Between(250, 420),
      onComplete: () => dust.destroy(),
    });
  }
}

function detectHit(fingerX) {
  const horizontalDistance = Math.abs(this.ant.x - fingerX);
  const verticalDistance = Math.abs(this.ant.y - (TABLE_Y - 30));
  if (horizontalDistance < 42 && verticalDistance < 56) {
    handleDeath.call(this);
  }
}

function handleDeath() {
  if (this.state.gameOver) {
    return;
  }

  this.state.gameOver = true;
  this.physics.pause();
  this.attackLoop.paused = true;

  playSound.call(this, this.sfx.splat);
  playSound.call(this, this.sfx.laugh);

  this.tweens.add({ targets: this.ant, scaleX: 1.45, scaleY: 0.22, y: TABLE_Y - 16, duration: 140 });

  for (let i = 0; i < 10; i += 1) {
    const chunk = this.add.circle(this.ant.x, this.ant.y, Phaser.Math.Between(3, 6), 0x6d301e);
    this.tweens.add({
      targets: chunk,
      x: chunk.x + Phaser.Math.Between(-110, 110),
      y: chunk.y + Phaser.Math.Between(-125, 45),
      alpha: 0,
      duration: Phaser.Math.Between(350, 620),
      ease: 'Cubic.out',
      onComplete: () => chunk.destroy(),
    });
  }

  this.statusText.setText('SQUISHED!\nShe laughs at the tiny ant!').setVisible(true);
  this.restartText.setVisible(true);
}

function collectCrumb(_, crumb) {
  crumb.destroy();
  this.state.crumbs += 1;
  this.state.score += 55;
  spawnCrumb.call(this);

  const text = this.add.text(this.ant.x, this.ant.y - 40, '+55', {
    fontSize: '23px',
    color: '#ffe066',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  this.tweens.add({ targets: text, y: text.y - 40, alpha: 0, duration: 430, onComplete: () => text.destroy() });
}

function increaseDifficulty() {
  if (this.state.gameOver) {
    return;
  }

  this.state.attackSpeed = Math.min(2.4, this.state.attackSpeed + 0.14);
  if (this.state.elapsed > 14) {
    this.state.fingerCount = Math.min(3, this.state.fingerCount + 1);
  }

  this.state.attackDelay = Math.max(900, this.state.attackDelay - 140);
  this.attackLoop.delay = this.state.attackDelay;

  if (this.platforms.getLength() < 7) {
    const block = this.add.rectangle(
      Phaser.Math.Between(120, GAME_WIDTH - 120),
      Phaser.Math.Between(675, 780),
      Phaser.Math.Between(58, 88),
      18,
      0xffe6cf,
    ).setDepth(-5);
    this.physics.add.existing(block, true);
    this.platforms.add(block);
  }
}

function synthSfx(params) {
  if (!this.sound || !this.sound.context) {
    return;
  }

  const { context } = this.sound;
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = params.type || 'sine';
  osc.frequency.setValueAtTime(params.freq || 220, now);
  if (params.sweep) {
    osc.frequency.linearRampToValueAtTime(Math.max(40, (params.freq || 220) + params.sweep), now + (params.duration || 0.2));
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(params.volume || 0.1, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (params.duration || 0.2));

  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(now);
  osc.stop(now + (params.duration || 0.2));
}

function playSound(soundFn) {
  if (typeof soundFn !== 'function') {
    return;
  }

  if (this.sound.locked) {
    this.sound.once('unlocked', () => soundFn());
  } else {
    soundFn();
  }
}
