const $ = (selector) => document.querySelector(selector);

const todayDate = $("#todayDate");
todayDate.textContent = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date());

const getTasks = () => {
  try { return JSON.parse(localStorage.getItem("studyBuddyTasks")) || []; }
  catch { return []; }
};
let tasks = getTasks();

function saveTasks() {
  localStorage.setItem("studyBuddyTasks", JSON.stringify(tasks));
  renderTasks();
}
function renderTasks() {
  const list = $("#taskList");
  list.innerHTML = "";
  if (!tasks.length) {
    list.innerHTML = '<p class="empty-state">No tasks yet. Add your first study goal above!</p>';
  }
  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = `task-item ${task.done ? "done" : ""}`;
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.setAttribute("aria-label", `Mark ${task.name} complete`);
    check.addEventListener("change", () => {
      task.done = check.checked;
      saveTasks();
    });
    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.name;
    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.name}`);
    remove.addEventListener("click", () => {
      tasks = tasks.filter((entry) => entry.id !== task.id);
      saveTasks();
    });
    item.append(check, name, remove);
    list.append(item);
  });
  updateStats();
}
function updateStats() {
  const completed = tasks.filter(task => task.done).length;
  const total = tasks.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  $("#completedCount").textContent = completed;
  $("#plannedCount").textContent = total;
  $("#progressText").textContent = `${percent}% completed`;
  $("#progressFill").style.width = `${percent}%`;
}
$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#taskInput");
  const name = input.value.trim();
  if (!name) return;
  tasks.push({ id: Date.now(), name, done: false });
  input.value = "";
  saveTasks();
});
renderTasks();

// Demo study assistant. This uses prepared responses and does not call an AI API.
function assistantReply(message) {
  const text = message.toLowerCase();
  if (text.includes("photosynthesis")) return "Photosynthesis is how green plants make their own food. They use sunlight, water and carbon dioxide to make glucose (food) and release oxygen. Think of leaves as tiny solar-powered kitchens!";
  if (text.includes("focus") || text.includes("concentrat")) return "Try the 25–5 method: study with full focus for 25 minutes, then take a 5-minute break. Keep your phone away, choose one small goal and drink water. Start with just one session.";
  if (text.includes("exam") || text.includes("prepare")) return "Make a list of topics, study the most important ones first, and practise questions after each topic. Use short revision notes and sleep well before the exam. A simple daily plan is better than last-minute cramming.";
  if (text.includes("html")) return "HTML stands for HyperText Markup Language. It creates the structure of a webpage, such as headings, paragraphs, images, links and forms.";
  if (text.includes("css")) return "CSS stands for Cascading Style Sheets. It controls how a webpage looks: colours, fonts, spacing, layouts and responsive design.";
  if (text.includes("javascript") || text.includes(" js")) return "JavaScript adds behaviour to a webpage. It can respond to button clicks, validate forms, update content and make interactive features.";
  if (text.includes("time") || text.includes("timetable")) return "Plan 2–3 focused study sessions. Put difficult subjects when you feel fresh, add short breaks, and leave 15 minutes at the end for revision.";
  return "Good question! Try breaking the topic into smaller parts: first understand the meaning, then read one example, and finally explain it in your own words. For this demo, I can help with study tips, exam preparation, photosynthesis, HTML, CSS and JavaScript.";
}
function addChatMessage(message, who) {
  const row = document.createElement("div");
  row.className = `chat-message ${who}`;
  const avatar = document.createElement("span");
  avatar.className = "chat-avatar";
  avatar.textContent = who === "bot" ? "✦" : "S";
  const bubble = document.createElement("p");
  bubble.textContent = message;
  row.append(avatar, bubble);
  $("#chatBox").append(row);
  $("#chatBox").scrollTop = $("#chatBox").scrollHeight;
}
function sendMessage(message) {
  const clean = message.trim();
  if (!clean) return;
  addChatMessage(clean, "user");
  addChatMessage(assistantReply(clean), "bot");
}
$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  sendMessage(input.value);
  input.value = "";
});
document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});

// Five-question beginner quiz.
const questions = [
  { q: "Which language gives a webpage its basic structure?", options: ["CSS", "HTML", "Python", "SQL"], answer: 1 },
  { q: "Which language is mainly used to style a webpage?", options: ["CSS", "C++", "Java", "PHP"], answer: 0 },
  { q: "What does CPU stand for?", options: ["Computer Personal Unit", "Central Processing Unit", "Central Program Utility", "Control Processing User"], answer: 1 },
  { q: "Which one is an input device?", options: ["Monitor", "Speaker", "Keyboard", "Projector"], answer: 2 },
  { q: "Which practice helps you remember a topic?", options: ["Avoiding revision", "Active recall", "Only highlighting", "Skipping practice"], answer: 1 }
];
let questionIndex = 0;
let score = 0;
let selectedAnswer = null;
let answered = false;
let bestScore = Number(localStorage.getItem("studyBuddyBestScore") || 0);
$("#bestScore").textContent = `${bestScore}%`;

function showQuestion() {
  const current = questions[questionIndex];
  selectedAnswer = null;
  answered = false;
  $("#quizArea").innerHTML = `
    <div class="quiz-controls"><span class="eyebrow">QUESTION ${questionIndex + 1} OF ${questions.length}</span><span class="date-chip">${score} correct so far</span></div>
    <p class="quiz-question">${current.q}</p>
    <div class="quiz-options">${current.options.map((option, index) => `<button class="quiz-option" type="button" data-index="${index}">${String.fromCharCode(65 + index)}. ${option}</button>`).join("")}</div>
    <p class="quiz-feedback" id="quizFeedback" aria-live="polite">Select an answer to continue.</p>
    <div class="quiz-controls"><span class="section-copy">Take your time.</span><button class="primary-btn" id="nextQuestion" disabled>${questionIndex === questions.length - 1 ? "See result" : "Next question"} →</button></div>`;
  document.querySelectorAll(".quiz-option").forEach(button => {
    button.addEventListener("click", () => {
      if (answered) return;
      selectedAnswer = Number(button.dataset.index);
      answered = true;
      const correct = selectedAnswer === current.answer;
      if (correct) score++;
      document.querySelectorAll(".quiz-option").forEach((option, index) => {
        option.disabled = true;
        if (index === current.answer) option.classList.add("selected");
      });
      $("#quizFeedback").textContent = correct ? "Well done! That's the right answer." : `Not quite. The correct answer is ${current.options[current.answer]}.`;
      $("#nextQuestion").disabled = false;
    });
  });
  $("#nextQuestion").addEventListener("click", () => {
    if (!answered) return;
    questionIndex++;
    if (questionIndex < questions.length) showQuestion();
    else showResult();
  });
}
function showResult() {
  const percent = Math.round(score / questions.length * 100);
  if (percent > bestScore) {
    bestScore = percent;
    localStorage.setItem("studyBuddyBestScore", String(bestScore));
    $("#bestScore").textContent = `${bestScore}%`;
  }
  $("#quizArea").innerHTML = `<div class="quiz-result"><div class="quiz-illustration" style="margin:0 auto 12px">★</div><strong>${score}/${questions.length}</strong><p>You scored ${percent}%. ${percent >= 80 ? "Amazing work! Keep learning." : "Good effort! Review and try again."}</p><button class="primary-btn" id="retryQuiz">Try again ↻</button></div>`;
  $("#retryQuiz").addEventListener("click", startQuiz);
}
function startQuiz() {
  questionIndex = 0;
  score = 0;
  showQuestion();
}
$("#startQuiz").addEventListener("click", startQuiz);

// Mobile navigation drawer.
$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
    link.classList.add("active");
    $("#sidebar").classList.remove("open");
  });
});
