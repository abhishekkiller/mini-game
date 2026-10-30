/**
 * Game 8: The Impossible Quiz
 * Hilarious troll questions, logic traps, and hidden interactive answers.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

const QUIZ_QUESTIONS = [
  {
    q: "How many holes in a polo mint?",
    options: ["1", "2", "3", "4"],
    correct: 3, // Index 3: "4" (two 'o's + polo hole + hole through)
    hint: "Think about the letters and the candy!"
  },
  {
    q: "Can a match box?",
    options: ["Yes", "No", "No, but a tin can", "Only on Tuesdays"],
    correct: 2,
    hint: "Wordplay is your friend."
  },
  {
    q: "Tap the SMALLEST dot on screen",
    specialType: 'dot_trick',
    options: ["Big Dot 🔴", "Medium Dot 🟣", "Small Dot 🟢", "Tiny Dot 🟡"],
    correctText: "Click the period '.' in the question title!",
    correctDot: 'dot-in-text'
  },
  {
    q: "What was the answer to Question 2?",
    options: ["This one", "That one", "No, but a tin can", "42"],
    correct: 2,
    hint: "Hope you were paying attention!"
  },
  {
    q: "Click the physically GREEN button:",
    buttonColors: [
      { text: "RED", bg: "#00e676", isCorrect: true },
      { text: "GREEN", bg: "#ff1744", isCorrect: false },
      { text: "BLUE", bg: "#2979ff", isCorrect: false },
      { text: "YELLOW", bg: "#ffd600", isCorrect: false }
    ],
    hint: "Look at the background color, ignore the words!"
  },
  {
    q: "Which one weighs the most?",
    options: ["1000kg of Feathers", "1000kg of Bricks", "Your Browser History", "They weigh the same"],
    correct: 2,
    hint: "The emotional weight is unbearable."
  },
  {
    q: "What do you call a fly without wings?",
    options: ["A crawl", "A walk", "Broken", "An insect"],
    correct: 1,
    hint: "If it can't fly, it must..."
  },
  {
    q: "Don't press ANY of these buttons!",
    options: ["DO NOT PRESS", "DANGER", "FORBIDDEN", "SKIP QUESTION ➔"],
    correct: 3,
    hint: "Look for the polite way out."
  },
  {
    q: "Spell 'GIRAFFE' backwards:",
    options: ["EFFARIG", "EFARIG", "GIRAFFE", "BACKWARDS"],
    correct: 3,
    hint: "Read the prompt very literally."
  },
  {
    q: "FINAL TEST: Is this quiz truly impossible?",
    options: ["Yes, impossible", "No, I am a Legend", "Maybe", "Ask later"],
    correct: 1,
    hint: "You made it here! Take your crown!"
  }
];

export class ImpossibleQuizGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.lives = 3;
    this.currentIndex = 0;
    this.score = 0;
    this.timeLeft = 14;
    this.timerInterval = null;
    this.state = 'idle';
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view quiz-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-value" id="quiz-timer">14s</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">LIVES</span>
            <span class="hud-value highlight" id="quiz-lives">❤️❤️❤️</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">QUESTION</span>
            <span class="hud-value" id="quiz-progress">1/10</span>
          </div>
        </div>

        <div class="quiz-container">
          <div class="quiz-question-card" id="quiz-qcard">
            <div class="quiz-q-text" id="quiz-question">Loading question...</div>
          </div>

          <div class="quiz-options-area" id="quiz-options">
            <!-- Dynamic options -->
          </div>
        </div>

        <div class="game-hint" id="quiz-hint">Caution: Every question has a sneaky catch!</div>
      </div>
    `;

    this.timerElem = this.container.querySelector('#quiz-timer');
    this.livesElem = this.container.querySelector('#quiz-lives');
    this.progressElem = this.container.querySelector('#quiz-progress');
    this.questionElem = this.container.querySelector('#quiz-question');
    this.optionsElem = this.container.querySelector('#quiz-options');
    this.qcardElem = this.container.querySelector('#quiz-qcard');

    this.startGame();
  }

  startGame() {
    this.state = 'playing';
    this.lives = 3;
    this.currentIndex = 0;
    this.score = 0;
    this.showQuestion();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timeLeft = 14;
    this.timerElem.textContent = `${this.timeLeft}s`;
    this.timerElem.classList.remove('urgent');

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.timerElem.textContent = `${this.timeLeft}s`;

      if (this.timeLeft <= 4) {
        sound.playTick(true);
        this.timerElem.classList.add('urgent');
      }

      if (this.timeLeft <= 0) {
        this.loseLife("Time ran out! ⏰");
      }
    }, 1000);
  }

  showQuestion() {
    if (this.currentIndex >= QUIZ_QUESTIONS.length) {
      this.winGame();
      return;
    }

    const q = QUIZ_QUESTIONS[this.currentIndex];
    this.progressElem.textContent = `${this.currentIndex + 1}/${QUIZ_QUESTIONS.length}`;
    this.startTimer();

    if (q.specialType === 'dot_trick') {
      // Smallest dot question: the period in the sentence is clickable!
      this.questionElem.innerHTML = `Tap the SMALLEST dot on screen<span id="secret-dot" class="secret-dot" title="Could this be it?">.</span>`;
      const secretDot = this.questionElem.querySelector('#secret-dot');
      secretDot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.correctAnswer();
      });

      this.optionsElem.innerHTML = '';
      q.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('pointerdown', () => this.loseLife("Too big! The period '.' was the smallest dot!"));
        this.optionsElem.appendChild(btn);
      });
    } else if (q.buttonColors) {
      this.questionElem.textContent = q.q;
      this.optionsElem.innerHTML = '';
      q.buttonColors.forEach((b) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = b.text;
        btn.style.backgroundColor = b.bg;
        btn.style.color = '#000000';
        btn.style.fontWeight = '900';
        btn.addEventListener('pointerdown', () => {
          if (b.isCorrect) this.correctAnswer();
          else this.loseLife("That wasn't physically green!");
        });
        this.optionsElem.appendChild(btn);
      });
    } else {
      this.questionElem.textContent = q.q;
      this.optionsElem.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('pointerdown', () => {
          if (idx === q.correct) this.correctAnswer();
          else this.loseLife();
        });
        this.optionsElem.appendChild(btn);
      });
    }
  }

  correctAnswer() {
    clearInterval(this.timerInterval);
    sound.playSuccess();
    this.score++;

    this.qcardElem.classList.add('flash-green');
    setTimeout(() => this.qcardElem?.classList.remove('flash-green'), 200);

    this.currentIndex++;
    setTimeout(() => this.showQuestion(), 400);
  }

  loseLife(msg = "Wrong! Troll caught you!") {
    this.lives--;
    sound.playError();

    const hearts = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(3 - Math.max(0, this.lives));
    this.livesElem.textContent = hearts;

    this.qcardElem.classList.add('flash-red');
    this.container.classList.add('shake');
    setTimeout(() => {
      this.qcardElem?.classList.remove('flash-red');
      this.container?.classList.remove('shake');
    }, 300);

    if (this.lives <= 0) {
      this.endGame();
    } else {
      clearInterval(this.timerInterval);
      this.startTimer();
    }
  }

  winGame() {
    clearInterval(this.timerInterval);
    this.state = 'ended';
    storage.unlockAchievement('quiz_master');

    const coinsEarned = 200;
    storage.addCoins(coinsEarned);

    const isNewBest = storage.saveHighScore('impossible_quiz', 10);
    sound.playFanfare();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'impossible_quiz',
        gameTitle: 'The Impossible Quiz',
        score: 10,
        scoreUnit: 'questions',
        subtitle: `CONQUERED! You are un-trollable! • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 600);
  }

  endGame() {
    this.state = 'ended';
    clearInterval(this.timerInterval);
    sound.playError();

    const coinsEarned = this.score * 15;
    storage.addCoins(coinsEarned);
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('impossible_quiz', this.score);

    setTimeout(() => {
      this.onGameOver({
        gameId: 'impossible_quiz',
        gameTitle: 'The Impossible Quiz',
        score: this.score,
        scoreUnit: 'solved',
        subtitle: `Trolled at Q${this.currentIndex + 1} • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 600);
  }

  destroy() {
    clearInterval(this.timerInterval);
    this.state = 'ended';
    this.container.innerHTML = '';
  }
}
