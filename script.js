document.addEventListener('DOMContentLoaded', () => {
    let progress = 0;
    const bar = document.getElementById('loader-progress');
    const status = document.getElementById('loader-status');
    const preloader = document.getElementById('preloader');

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            if (bar) bar.style.width = '100%';
            if (status) status.innerText = 'Sync Complete';
            setTimeout(() => {
                if (preloader) preloader.classList.add('fade-out');
            }, 300);
        } else {
            if (bar) bar.style.width = `${progress}%`;
            if (status) status.innerText = `Loading Assets... ${progress}%`;
        }
    }, 40);

    // Initialize FaultyTerminal background for Technical Quiz
    const container = document.getElementById('technical-bg-container');
    if (container && typeof FaultyTerminal !== 'undefined') {
        new FaultyTerminal(container, {
            scale: 1.5,
            gridMul: [8, 4],
            digitSize: 0.55,
            timeScale: 1,
            pause: false,
            scanlineIntensity: 0.3,
            glitchAmount: 1,
            flickerAmount: 1,
            noiseAmp: 0.4,
            chromaticAberration: 0,
            dither: 0,
            curvature: 0,
            tint: '#004d61',
            mouseReact: true,
            mouseStrength: 0.5,
            pageLoadAnimation: false,
            brightness: 1
        });
    }

    // Initialize DotField background for Aptitude Test (Round 1)
    const aptContainer = document.getElementById('aptitude-bg-container');
    if (aptContainer && typeof DotField !== 'undefined') {
        new DotField(aptContainer, {
            dotRadius: 3.5,
            dotSpacing: 18,
            bulgeStrength: 67,
            glowRadius: 160,
            sparkle: false,
            waveAmplitude: 0,
            gradientFrom: 'rgba(229, 152, 80, 0.7)',
            gradientTo: 'rgba(235, 220, 208, 0.45)',
            glowColor: '#4d2005'
        });
    }
});

// State Management
const STATE = {
    scores: [0, 0, 0, 0, 0, 0, 0, 0], // T1-T6, T8 (T7 unused)
    currentRound: null,
    currentQuestionId: null,
    answeredQuestions: new Set(), // Store "round_id-question_id"
    history: [], // Store history objects
    timerValue: 60,
    timerInterval: null,
    isTimerPaused: false,
    activeTeam: null
};

// Data Generation Structure
const ROUND_NAMES = {
    1: "Aptitude Test",
    2: "Technical Quiz",
    3: "Debate/JAM/TASF",
    4: "Fun Round"
};

function hideAllBackgrounds() {
    document.body.classList.remove('lobby-active', 'round-1-active', 'round-2-active', 'round-3-active', 'round-4-active');
    document.body.classList.remove('morph-preview-1', 'morph-preview-2', 'morph-preview-3', 'morph-preview-4');
    updateWatermark(null);
}

const RULES_DATA = {
    1: [
        "Each team will participate one by one.",
        "Aptitude round topics: time and distance.",
        "Each team gets 1 questions per turn.",
        "60 seconds are given for each question.",
        "Only one member from the team will answer the questions.",
        "The first answer given is final - no changes allowed.",
        "10 point for each correct answer.",
        "Any disturbance or misbehavior will lead to loss of marks."
    ],
    2: [
        "Each team will participate one by one.",
        "Questions are from C++, java and python",
        "Each team gets 1 questions per turn.",
        "60 seconds are given for each question.",
        "Only one member from the team will answer the questions.",
        "The first answer given is final - no changes allowed.",
        "10 point for each correct answer.",
        "Any disturbance or misbehavior will lead to loss of marks."
    ],
    3: [
        "1. This round contains JAM (JUST A MIN), DEBATE and TEACH A SKILL FLASH (TASF).",
        "2. A total of 5 topics are provided in this round.",
        "3. Team leader will draw their topic number from a box provided by our team.",
        "4. You are given a 5 mins time slot to browser the content.",
        "5. After completion of the given time slot each team will deliver a JAM on their topic in a sequential order, the team will be awarded 10 points by faculty co-ordinator.",
        "6. Any form of misbehavior, such as arguing with the coordinator or disrupting the quiz, will result in your team receiving 0 marks for the round. The final decision rests with the faculty coordinator."
    ],
    4: [
        "The round includes three categories: Guess the Movie, Guess the Song and dialogue",
        "Only one member from the team can answer the question.",
        "You will get 1min to answer the question.",
        "Each correct answer carries 10 marks."
    ]
};

const QUIZ_DATA = {};

// Helper to generate placeholders for other rounds
for (let r = 1; r <= 4; r++) {
    if (r === 1 || r === 2 || r === 3 || r === 4) continue; // Skip real question rounds
    QUIZ_DATA[r] = [];
    for (let q = 1; q <= 20; q++) {
        QUIZ_DATA[r].push({
            id: q,
            text: `${ROUND_NAMES[r]} - Question ${q}`,
            options: [`Option A`, `Option B`, `Option C`, `Option D`],
            correctOptionIndex: Math.floor(Math.random() * 4),
            explanation: `Explanation for ${ROUND_NAMES[r]} - Q${q}`
        });
    }
}

// Debate/JAM (Round 3) - Real Questions
QUIZ_DATA[3] = [
    { id: 1, type: "Debate", topic: "1. Pan-India Films Vs Telugu Regional Films" },
    { id: 2, type: "Debate", topic: "2. Mughal ruling Vs British ruling" },
    { id: 3, type: "JAM", topic: "3. Does playing video games benefit learning?" },
    { id: 4, type: "Teach a skill flash", topic: "4. How can a strong, memorable password be created?" },
    { id: 5, type: "Teach a skill flash", topic: "5. Keyboard shortcuts most people don't know" },
];

// Aptitude Test (Round 1) - Real Questions
// Aptitude Test (Round 1) - Real Questions
QUIZ_DATA[1] = [
    {
        id: 1,
        text: "A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?",
        options: ["3.6", "7.2", "8.4", "10"],
        correctOptionIndex: 1,
        explanation: "Speed = (600 / (5 * 60)) m/sec\n=> 2 m/sec\nConverting m/sec to km/hr:\n=> (2 * (18/5)) km/hr\n=> 7.2 km/hr."
    },
    {
        id: 2,
        text: "An aeroplane covers a certain distance at a speed of 240 kmph in 5 hours. To cover the same distance in 1 <span class=\"fraction\"><span class=\"num\">2</span><span class=\"den\">3</span></span> hours, it must travel at a speed of:",
        options: ["300 kmph", "360 kmph", "600 kmph", "720 kmph"],
        correctOptionIndex: 3,
        explanation: "Distance = (240 x 5) = 1200 km.\nSpeed = Distance / Time\n=> 1200 / (5/3) km/hr [1 2/3 hrs = 5/3 hrs]\n=> (1200 * 3/5) km/hr\n=> 720 km/hr."
    },
    {
        id: 3,
        text: "If a person walks at 14 km/hr instead of 10 km/hr, he would have walked 20 km more. The actual distance travelled by him is:",
        options: ["50 km", "56 km", "70 km", "80 km"],
        correctOptionIndex: 0,
        explanation: "Let the actual distance be x km.\nThen x/10 = (x + 20)/14\n=> 14x = 10x + 200\n=> 4x = 200\n=> x = 50 km."
    },
    {
        id: 4,
        text: "A train can travel 50% faster than a car. Both start from point A at the same time and reach point B 75 kms away from A at the same time. On the way, however, the train lost about 12.5 minutes while stopping at the stations. The speed of the car is:",
        options: ["100 kmph", "110 kmph", "120 kmph", "130 kmph"],
        correctOptionIndex: 2,
        explanation: "Let speed of the car be x kmph.\nThen speed of the train = (150/100)x = 3x/2 kmph.\n(75/x) - (75 / (3x/2)) = 12.5/60\n=> 75/x - 50/x = 5/24\n=> 25/x = 5/24\n=> x = 120 kmph."
    },
    {
        id: 5,
        text: "Excluding stoppages, the speed of a bus is 54 kmph and including stoppages, it is 45 kmph. For how many minutes does the bus stop per hour?",
        options: ["9", "10", "12", "20"],
        correctOptionIndex: 1,
        explanation: "Due to stoppages, it covers 9 km less per hour (54 - 45 = 9).\nTime taken to cover 9 km at 54 kmph:\n=> (9/54) * 60 min\n=> 10 min."
    },
    {
        id: 6,
        text: "In a flight of 600 km, an aircraft was slowed down due to bad weather. Its average speed for the trip was reduced by 200 km/hr and the time of flight increased by 30 minutes. The duration of the flight is:",
        options: ["1 hour", "2 hours", "3 hours", "4 hours"],
        correctOptionIndex: 0,
        explanation: "Let the duration of the flight be x hours.\nThen 600/x - 600/(x + 1/2) = 200\n=> 600/x - 1200/(2x + 1) = 200\n=> 3/x - 6/(2x+1) = 1\n=> 3(2x + 1) - 6x = x(2x + 1)\n=> 6x + 3 - 6x = 2x^2 + x\n=> 2x^2 + x - 3 = 0\n=> (2x + 3)(x - 1) = 0\n=> x = 1 hr (neglecting negative value)."
    },
    {
        id: 7,
        text: "A man complete a journey in 10 hours. He travels first half of the journey at the rate of 21 km/hr and second half at the rate of 24 km/hr. Find the total journey in km.",
        options: ["220 km", "224 km", "230 km", "234 km"],
        correctOptionIndex: 1,
        explanation: "Let total distance be x km.\n(x/2)/21 + (x/2)/24 = 10\n=> x/42 + x/48 = 10\n=> (8x + 7x)/336 = 10\n=> 15x = 3360\n=> x = 224 km."
    },
    {
        id: 8,
        text: "The ratio between the speeds of two trains is 7 : 8. If the second train runs 400 km in 4 hours, then the speed of the first train is:",
        options: ["70 km/hr", "75 km/hr", "84 km/hr", "87.5 km/hr"],
        correctOptionIndex: 3,
        explanation: "Let the speed of two trains be 7x and 8x km/hr.\n8x = 400/4 = 100\n=> x = 12.5\nSpeed of first train = (7 * 12.5) km/hr\n=> 87.5 km/hr."
    },
    {
        id: 9,
        text: "A man on tour travels first 160 km at 64 km/hr and the next 160 km at 80 km/hr. The average speed for the first 320 km of the tour is:",
        options: ["35.55 km/hr", "36 km/hr", "71.11 km/hr", "71 km/hr"],
        correctOptionIndex: 2,
        explanation: "Total time taken = (160/64 + 160/80) hrs\n=> 2.5 + 2 = 4.5 hrs\nAverage speed = 320 / 4.5\n=> 71.11 km/hr."
    },
    {
        id: 10,
        text: "A car travelling with 5/7 of its actual speed covers 42 km in 1 hr 40 min 48 sec. Find the actual speed of the car.",
        options: ["17(6/7) km/hr", "25 km/hr", "30 km/hr", "35 km/hr"],
        correctOptionIndex: 3,
        explanation: "Time = 1h 40m 48s = 1 + 40/60 + 48/3600\n=> 1.68 hrs\nSpeed = Distance / Time\n=> 42 / 1.68\n=> 25 km/hr\nIf (5/7) * Actual Speed = 25:\n=> Actual Speed = 25 * 7/5\n=> 35 km/hr."
    },
    {
        id: 11,
        text: "In covering a distance of 30 km, Abhay takes 2 hours more than Sameer. If Abhay doubles his speed, then he would take 1 hour less than Sameer. Abhay's speed is:",
        options: ["5 kmph", "6 kmph", "6.25 kmph", "7.5 kmph"],
        correctOptionIndex: 0,
        explanation: "Let Abhay's speed be x km/hr.\n(30/x) - (30/2x) = 3\n=> 15/x = 3\n=> x = 5 km/hr."
    },
    {
        id: 12,
        text: "Robert is travelling on his cycle and has calculated to reach point A at 2 P.M. if he travels at 10 kmph, he will reach there at 12 noon if he travels at 15 kmph. At what speed must he travel to reach A at 1 P.M.?",
        options: ["8 kmph", "11 kmph", "12 kmph", "14 kmph"],
        correctOptionIndex: 2,
        explanation: "Let distance travelled be x km.\n(x/10) - (x/15) = 2\n=> 3x - 2x = 60\n=> x = 60 km\nTime at 10kmph = 60/10 = 6 hrs\nRobert started at 8 A.M. (6 hrs before 2 P.M.)\nRequired speed to reach at 1 P.M. (5 hrs journey):\n=> 60/5\n=> 12 kmph."
    },
    {
        id: 13,
        text: "It takes eight hours for a 600 km journey, if 120 km is done by train and the rest by car. It takes 20 minutes more, if 200 km is done by train and the rest by car. The ratio of the speed of the train to that of the car is:",
        options: ["2 : 3", "3 : 2", "3 : 4", "4 : 3"],
        correctOptionIndex: 2,
        explanation: "Let speed of train = x km/hr and car = y km/hr.\n(120/x) + (480/y) = 8\n=> (1/x) + (4/y) = 1/15 --(i)\n(200/x) + (400/y) = 25/3\n=> (1/x) + (2/y) = 1/24 --(ii)\nSolving (i) and (ii):\n=> x = 60 and y = 80.\nRatio = 60 : 80\n=> 3 : 4."
    },
    {
        id: 14,
        text: "A farmer travelled a distance of 61 km in 9 hours. He travelled partly on foot @ 4 km/hr and partly on bicycle @ 9 km/hr. The distance travelled on foot is:",
        options: ["14 km", "15 km", "16 km", "17 km"],
        correctOptionIndex: 2,
        explanation: "Let distance on foot = x km.\n(x / 4) + ((61 - x) / 9) = 9\n=> 9x + 4(61 - x) = 324\n=> 5x = 80\n=> x = 16 km."
    },
    {
        id: 15,
        text: "A man covered a certain distance at some speed. Had he moved 3 kmph faster, he would have taken 40 minutes less. If he had moved 2 kmph slower, he would have taken 40 minutes more. The distance (in km) is:",
        options: ["35", "36(2/3)", "37(1/2)", "40"],
        correctOptionIndex: 3,
        explanation: "Let distance = x and usual rate = y.\n(x/y) - (x / (y+3)) = 2/3\n=> 3x(3) = 2y(y+3)\n=> 9x = 2y(y+3) --(i)\n(x / (y-2)) - (x/y) = 2/3\n=> 3x(2) = 2y(y-2)\n=> 3x = y(y-2) --(ii)\nDividing (i) by (ii):\n=> x = 40 km."
    }
];

// Fun Round (Round 4) - Real Questions
QUIZ_DATA[4] = [
    {
        id: 1,
        text: "Guess the movie name",
        image: "media/q1.jpeg",
        answerText: "Movie Name: <b>Ravanasura</b>",
        explanation: "Correct answer is Ravanasura."
    },
    {
        id: 2,
        text: "In July 2015, a 13-year-old school-goer, Nilesh Tiwari was murdered by two seniors from school in the Nalasopara area of Mumbai. On interrogation, it was learnt that the kids were hugely inspired by a telugu movie 'X'. The juveniles had watched the dubbed version of the film multiple times on TV and aspired to become local dadas, much like the underworld kingpins in the film. The two had a history of terrorising other kids on their short-lived journey to dadagiri.<br/><br/>Identify movie X.",
        answerText: "answer is: <b>Don</b>",
        answerImage: "media/q2.jpg",
        explanation: "Correct answer is movie <b>Don</b>."
    },
    {
        id: 3,
        text: "Recreate the dialogue",
        video: "media/q3.mp4",
        muted: true,
        answerText: "Dialogue Recreated",
        answerVideo: "media/q3.mp4",
        explanation: "Recreate the dialogue from the clip."
    },
    {
        id: 4,
        text: "Watch the video clue carefully.",
        video: "media/q4.mp4",
        isMultiPhase: true,
        secondQuestionText: "How many women are there in this video?",
        answerText: "Ans: <b>7</b>",
        explanation: "There are 7 women in the video clip."
    },
    {
        id: 5,
        text: "Observe the scene.",
        video: "media/q5.mp4",
        isMultiPhase: true,
        secondQuestionText: "How many balloons are there in this video?",
        answerText: "Ans: <b>9</b>",
        explanation: "There are 9 balloons in the scene."
    },
    {
        id: 6,
        text: "Analyze the clip.",
        video: "media/q6.mp4",
        isMultiPhase: true,
        secondQuestionText: "How many horses are there in this video?",
        answerText: "Ans: <b>4</b>",
        explanation: "There are 4 horses in the sequence."
    },
    {
        id: 7,
        text: "Observe the video closely.",
        video: "media/q7.mp4",
        isMultiPhase: true,
        secondQuestionText: "How many handcuffs are there on the wall?",
        answerText: "Ans: <b>Total 5</b> (3 on left and 2 on right)",
        explanation: "There are a total of 5 handcuffs; 3 on the left and 2 on the right."
    },
    {
        id: 8,
        text: "Recreate the dialogue",
        video: "media/q8.mp4",
        muted: true,
        answerText: "Dialogue Recreated",
        answerVideo: "media/q8.mp4",
        explanation: "Recreate the dialogue from the clip."
    }
];

// Technical Quiz (Round 2) - Real Questions
QUIZ_DATA[2] = [
    {
        id: 1,
        text: "What is the difference between delete and delete[] in C++?",
        options: [
            "delete is syntactically correct but delete[] is wrong",
            "delete is used to delete normal objects whereas delete[] is used to pointer objects",
            "delete is a keyword whereas delete[] is an identifier",
            "delete is used to delete single object whereas delete[] is used to multiple(array) objects"
        ],
        correctOptionIndex: 3,
        explanation: "delete is used to delete a single object initiated using the new keyword, whereas delete[] is used to delete a group of objects initiated with the new operator."
    },
    {
        id: 2,
        text: "What is the value of p in the following C++ code snippet?\n\nint p;\nbool a = true;\nbool b = false;\nint x = 10;\nint y = 5;\np = ((x | y) + (a + b));",
        options: ["12", "0", "2", "16"],
        correctOptionIndex: 3,
        explanation: "| is the bitwise OR operator. x | y (10 | 5, or 1010 | 0101 in binary) evaluated to 1111 (15). (a + b) is (1 + 0) = 1. Thus, 15 + 1 = 16."
    },
    {
        id: 3,
        text: "By default, all the files in C++ are opened in _________ mode.",
        options: ["Binary", "VTC", "Text", "ISCII"],
        correctOptionIndex: 2,
        explanation: "By default, all the files in C++ are opened in text mode. They read the file as normal text."
    },
    {
        id: 4,
        text: "Which keyword is used to define the macros in C++?",
        options: ["#macro", "#define", "macro", "define"],
        correctOptionIndex: 1,
        explanation: "#define is the keyword that is used to define the macros in C++."
    },
    {
        id: 5,
        text: "The C++ code which causes abnormal termination/behaviour of a program should be written under _________ block.",
        options: ["catch", "throw", "try", "finally"],
        correctOptionIndex: 2,
        explanation: "Code that leads to the abnormal termination of the program should be written under the try block."
    },
    {
        id: 6,
        text: "Which of the following symbol is used to declare the preprocessor directives in C++?",
        options: ["$", "^", "#", "*"],
        correctOptionIndex: 2,
        explanation: "# symbol is used to declare the preprocessor directives."
    },
    {
        id: 7,
        text: "Pick the incorrect statement about inline functions in C++?",
        options: [
            "Saves overhead of a return call from a function",
            "They are generally very large and complicated function",
            "These functions are inserted/substituted at the point of call",
            "They reduce function call overheads"
        ],
        correctOptionIndex: 1,
        explanation: "Inline functions are generally kept small to reduce function call overheads by inserting the code directly at the call site."
    },
    {
        id: 8,
        text: "Which one of the following is not a Java feature?",
        options: ["Object-oriented", "Use of pointers", "Portable", "Dynamic and Extensible"],
        correctOptionIndex: 1,
        explanation: "Pointers are not a user-facing Java feature; Java provides an abstraction layer to manage memory safely without manual pointer manipulation."
    },
    {
        id: 9,
        text: "What will be the output of the following Java code?\n\nint g = 3;\nSystem.out.print(++g * 8);",
        options: ["32", "33", "24", "25"],
        correctOptionIndex: 0,
        explanation: "Operator ++ has higher precedence than *. g becomes 4, and 4 * 8 = 32."
    },
    {
        id: 10,
        text: "What will be the error in the following Java code?\n\nbyte b = 50;\nb = b * 50;",
        options: [
            "b cannot contain value 50",
            "b cannot contain value 100",
            "No error in this code",
            "* operator converted b * 50 into int, which requires casting back to byte"
        ],
        correctOptionIndex: 3,
        explanation: "In Java, binary operations on byte, short, or char promote the operands to int. The result must be cast back to byte if required."
    },
    {
        id: 11,
        text: "What is the extension of compiled java classes?",
        options: [".txt", ".js", ".class", ".java"],
        correctOptionIndex: 2,
        explanation: "The compiled Java files have the .class extension."
    },
    {
        id: 12,
        text: "Which of these packages contains the error StackOverflowError in Java?",
        options: ["java.io", "java.system", "java.lang", "java.util"],
        correctOptionIndex: 2,
        explanation: "StackOverflowError is located in the java.lang package."
    },
    {
        id: 13,
        text: "What is the numerical range of a char data type in Java?",
        options: ["0 to 256", "-128 to 127", "0 to 65535", "0 to 32767"],
        correctOptionIndex: 2,
        explanation: "In Java, char is a 16-bit unsigned integer (Unicode), ranging from 0 to 65,535."
    },
    {
        id: 14,
        text: "What will be the value of the following Python expression?\n\nprint(4 + 3 % 5)",
        options: ["7", "2", "4", "1"],
        correctOptionIndex: 0,
        explanation: "The modulus operator % has higher precedence than addition +. 3 % 5 is 3, so 4 + 3 = 7."
    },
    {
        id: 15,
        text: "What will be the output of the following Python code?\n\ni = 1\nwhile True:\n    if i%3 == 0:\n        break\n    print(i)\n    i + = 1",
        options: ["1 2 3", "SyntaxError", "1 2", "none of the mentioned"],
        correctOptionIndex: 1,
        explanation: "The syntax 'i + = 1' is invalid in Python because of the space. It should be 'i += 1'."
    },
    {
        id: 16,
        text: "Python supports the creation of anonymous functions at runtime, using a construct called __________",
        options: ["pi", "anonymous", "lambda", "none of the mentioned"],
        correctOptionIndex: 2,
        explanation: "Lambda functions are anonymous functions defined using the lambda keyword in Python."
    },
    {
        id: 17,
        text: "What will be the output of the following Python code snippet if x=1?\n\nx<<2",
        options: ["4", "2", "1", "8"],
        correctOptionIndex: 0,
        explanation: "Binary 1 is 0001. Left shifting by 2 yields 0100, which is decimal 4."
    },
    {
        id: 18,
        text: "What does pip stand for in Python?",
        options: ["Pip Installs Python", "Pip Installs Packages", "Preferred Installer Program", "All of the mentioned"],
        correctOptionIndex: 2,
        explanation: "pip is the package manager for Python, often referred to as the Preferred Installer Program."
    },
    {
        id: 19,
        text: "Which of the following is the truncation division operator in Python?",
        options: ["|", "//", "/", "%"],
        correctOptionIndex: 1,
        explanation: "// is the truncation division operator in Python, returning the integer part of the quotient."
    },
    {
        id: 20,
        text: "What will be the output of the following Python function?\n\nprint(len(['hello', 2, 4, 6]))",
        options: ["Error", "6", "4", "3"],
        correctOptionIndex: 2,
        explanation: "The len() function returns the number of elements in the list [\"hello\", 2, 4, 6], which is 4."
    }
];

// DOM Elements
const screenQuizSelection = document.getElementById('screen-quiz-selection');
const screenQuestionSelection = document.getElementById('screen-question-selection');
const screenQuestionActive = document.getElementById('screen-question-active');
const questionGrid = document.getElementById('question-grid');
const currentQuizTitle = document.getElementById('current-quiz-title');
const questionText = document.getElementById('question-text');
const timerDisplay = document.getElementById('timer-display');
const overlay = document.getElementById('question-overlay');

// Map Options
const optionButtons = [
    document.getElementById('opt-1'),
    document.getElementById('opt-2'),
    document.getElementById('opt-3'),
    document.getElementById('opt-4')
];

// Screen Navigation
let screenTransitionTimeout = null;

function showScreen(screen) {
    if (screenTransitionTimeout) {
        clearTimeout(screenTransitionTimeout);
        screenTransitionTimeout = null;
    }

    const activeScreen = document.querySelector('.screen.active');
    
    if (activeScreen && activeScreen !== screen) {
        // Lock dimensions and absolute-position the outgoing screen so it fades out in place
        const currentWidth = activeScreen.clientWidth;
        const currentHeight = activeScreen.clientHeight;
        activeScreen.style.width = `${currentWidth}px`;
        activeScreen.style.height = `${currentHeight}px`;
        activeScreen.style.position = 'absolute';
        
        activeScreen.classList.remove('active');
        
        // Show the new screen in the normal flow immediately so it fades/slides up under/over it
        screen.style.display = 'flex';
        
        screenTransitionTimeout = setTimeout(() => {
            screen.classList.add('active');
        }, 30);
        
        // Clean up styles once the 220ms transition completes
        screenTransitionTimeout = setTimeout(() => {
            activeScreen.style.display = 'none';
            activeScreen.style.position = '';
            activeScreen.style.width = '';
            activeScreen.style.height = '';
        }, 230);
    } else {
        document.querySelectorAll('.screen').forEach(s => {
            if (s !== screen) {
                s.classList.remove('active');
                s.style.display = 'none';
                s.style.position = '';
                s.style.width = '';
                s.style.height = '';
            }
        });
        screen.style.display = 'flex';
        screenTransitionTimeout = setTimeout(() => {
            screen.classList.add('active');
        }, 20);
    }
}

// Event Listeners for Quiz Selection
document.querySelectorAll('.quiz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const roundNum = btn.getAttribute('data-quiz');
        openRules(roundNum);
    });
});

function openRules(roundId) {
    STATE.currentRound = parseInt(roundId);
    document.getElementById('rules-title').innerText = `${ROUND_NAMES[roundId]} Rules`;

    hideAllBackgrounds();

    if (STATE.currentRound === 1) {
        document.body.classList.add('round-1-active');
    } else if (STATE.currentRound === 2) {
        document.body.classList.add('round-2-active');
    } else if (STATE.currentRound === 3) {
        document.body.classList.add('round-3-active');
    } else if (STATE.currentRound === 4) {
        document.body.classList.add('round-4-active');
    }

    // Set round-specific subheadings & meta tags for rules screen
    const subHeading = document.getElementById('rules-subheading');
    const metaTag = document.querySelector('.rules-meta-tag');
    if (subHeading && metaTag) {
        if (STATE.currentRound === 1) {
            metaTag.innerText = "ROUND 01 • APTITUDE";
            subHeading.innerText = "Assessment Rules & Format";
        } else if (STATE.currentRound === 2) {
            metaTag.innerText = "ROUND 02 • TERMINAL";
            subHeading.innerText = "system_rules.sh [v2.0]";
        } else if (STATE.currentRound === 3) {
            metaTag.innerText = "ROUND 03 • STARK";
            subHeading.innerText = "DEBATE & JAM PROTOCOL";
        } else if (STATE.currentRound === 4) {
            metaTag.innerText = "ROUND 04 • GAME SHOW";
            subHeading.innerText = "Fun Round Rulebook 🚀";
        }
    }

    // Populate rules list
    const rulesList = document.getElementById('rules-list');
    if (rulesList) {
        rulesList.innerHTML = '';
    }
    const spliceRulesList = document.getElementById('splice-rules-list');
    if (spliceRulesList) {
        spliceRulesList.innerHTML = '';
    }

    const rules = RULES_DATA[roundId] || ["General rules apply.", "+10 points for correct answer.", "1 minute timer."];
    rules.forEach((rule, idx) => {
        const numStr = String(idx + 1).padStart(2, '0');
        
        if (STATE.currentRound === 4 && spliceRulesList) {
            const li = document.createElement('li');
            li.className = 'splice-lineup-row';
            li.innerHTML = `<span class="row-num">${numStr} //</span> <span class="row-text">${rule}</span>`;
            spliceRulesList.appendChild(li);
        } else if (rulesList) {
            const li = document.createElement('li');
            li.className = `rule-item rule-item-r${roundId}`;
            li.setAttribute('data-num', numStr);
            if (STATE.currentRound === 2) {
                li.innerHTML = `<span class="term-prefix">&gt; [RULE_${numStr}]</span> <span class="term-text">${rule}</span>`;
            } else if (STATE.currentRound === 1) {
                li.innerHTML = `<span class="edit-num">${numStr}.</span> <span class="rule-text-content">${rule}</span>`;
            } else {
                li.innerHTML = `<span class="rule-text-content">${rule}</span>`;
            }
            rulesList.appendChild(li);
        }
    });

    // Switch UI
    showScreen(document.getElementById('screen-rules'));
}

function proceedToQuestionSelection() {
    if (STATE.currentRound === 3) {
        showDebateRoundView();
        return;
    }
    currentQuizTitle.innerText = ROUND_NAMES[STATE.currentRound];

    hideAllBackgrounds();
    if (STATE.currentRound === 1) {
        document.body.classList.add('round-1-active');
    } else if (STATE.currentRound === 2) {
        document.body.classList.add('round-2-active');
    } else if (STATE.currentRound === 3) {
        document.body.classList.add('round-3-active');
    } else if (STATE.currentRound === 4) {
        document.body.classList.add('round-4-active');
    }

    renderQuestionGrid(STATE.currentRound);
    showScreen(screenQuestionSelection);
}

function goBackToQuizSelectionFromRules() {
    showScreen(screenQuizSelection);
    document.body.classList.add('lobby-active');
    activateMorphRound(selectedMorphRound);
}

function renderQuestionGrid(roundId) {
    questionGrid.innerHTML = '';
    const questions = QUIZ_DATA[roundId];

    questions.forEach(q => {
        const btn = document.createElement('button');
        const key = `${roundId}-${q.id}`;

        btn.className = 'q-grid-btn';
        btn.innerHTML = `<span class="q-btn-text">Q${q.id}</span>`;

        if (STATE.answeredQuestions.has(key)) {
            btn.classList.add('answered');
            btn.onclick = () => viewAnsweredQuestion(q.id);
        } else {
            btn.onclick = () => openQuestion(q.id);
        }

        questionGrid.appendChild(btn);
    });

    // VanillaTilt removed
}

function goBackToRules() {
    openRules(STATE.currentRound);
}

function selectTeam(teamIndex) {
    STATE.activeTeam = teamIndex;
    document.querySelectorAll('.team-select-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.boxShadow = '';
        btn.style.border = '';
        btn.style.background = '';
    });
    const selectedBtn = document.getElementById(`ts-${teamIndex}`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    updateWatermark(teamIndex);
}

function detectCodeLanguage(promptText, codeText) {
    const text = ((promptText || '') + ' ' + (codeText || '')).toLowerCase();

    // Explicit prompt matches take top priority
    if (text.includes('java')) return 'java';
    if (text.includes('python')) return 'py';
    if (text.includes('c++') || text.includes('cpp')) return 'cpp';

    // Syntax heuristics
    if (text.includes('system.out') || text.includes('public static') || text.includes('byte b')) {
        return 'java';
    }
    if (text.includes('def ') || text.includes('lambda') || text.includes('import math') || text.includes('len(') || text.includes('elif ')) {
        return 'py';
    }
    if (text.includes('#include') || text.includes('cout') || text.includes('cin') || text.includes('delete[]')) {
        return 'cpp';
    }
    return 'cpp';
}

function formatQuestionText(questionId, rawText) {
    if (!rawText) return '';
    if (rawText.includes('\n\n')) {
        const parts = rawText.split('\n\n');
        const prompt = parts[0].trim();
        const codeBlockRaw = parts.slice(1).join('\n\n').trim();
        const codeLines = codeBlockRaw.split('\n').map(l => l.trimEnd()).filter(l => l.trim().length > 0);

        const ext = detectCodeLanguage(prompt, codeBlockRaw);

        const formattedCode = codeLines.map((line, idx) => {
            const lineNo = idx + 1;
            const escapedLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            // Simple single-pass regex replacement for syntax highlights
            let highlighted = escapedLine;
            const keywords = ['int', 'bool', 'true', 'false', 'class', 'struct', 'public', 'private', 'return', 'if', 'else', 'for', 'while', 'void', 'const', 'static'];
            const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
            highlighted = highlighted.replace(kwRegex, `<span class="token-keyword">$1</span>`);
            highlighted = highlighted.replace(/\b(\d+)\b/g, `<span class="token-number">$1</span>`);
            highlighted = highlighted.replace(/(\/\/.*)/g, `<span class="token-comment">$1</span>`);

            return `<div class="code-line"><span class="line-no">${lineNo}</span><span class="line-text">${highlighted}</span></div>`;
        }).join('');

        return `<div class="q-prompt-heading">Q${questionId}. ${prompt}</div><div class="q-code-container"><div class="code-window-header"><span class="code-title">code_snippet_${questionId}.${ext}</span></div><div class="code-block">${formattedCode}</div></div>`;
    } else {
        return `Q${questionId}. ${rawText}`;
    }
}

function openQuestion(questionId) {
    document.body.classList.remove('correct-bg', 'incorrect-bg');
    STATE.currentQuestionId = parseInt(questionId);
    console.log(`[DEBUG] Opening Question ID: ${STATE.currentQuestionId} in Round: ${STATE.currentRound}`);

    if (!STATE.activeTeam) {
        alert("Please select a team to answer first!");
        return;
    }

    const questionData = QUIZ_DATA[STATE.currentRound]?.find(q => q.id === STATE.currentQuestionId);
    if (!questionData) {
        console.error(`[ERROR] Question ID ${questionId} not found in Round ${STATE.currentRound}`);
        return;
    }

    console.log(`[DEBUG] Question Data loaded:`, questionData);

    // DOM Elements - Using local references to be safe
    const qMedia = document.getElementById('question-media');
    const qText = document.getElementById('question-text');
    const qMediaArea = document.getElementById('question-media-area');
    const showOptionsBtn = document.getElementById('show-options-btn');
    const revealAnswerBtn = document.getElementById('reveal-answer-btn');
    const optionsGrid = document.getElementById('options-grid');
    const answerContent = document.getElementById('answer-content');
    const manualControls = document.getElementById('fun-manual-controls');

    // Reset visibility
    if (qMediaArea) qMediaArea.classList.remove('hidden');
    if (answerContent) answerContent.classList.add('hidden');
    if (manualControls) {
        manualControls.classList.add('hidden');
        manualControls.style.display = ''; // Reset inline style
    }

    const qActionBar = document.querySelector('.question-action-bar');

    if (STATE.currentRound === 4) {
        if (showOptionsBtn) showOptionsBtn.classList.add('hidden');
        if (revealAnswerBtn) revealAnswerBtn.classList.remove('hidden');
        if (optionsGrid) optionsGrid.classList.add('hidden');
        if (qText) qText.classList.remove('hidden');
        if (qActionBar) qActionBar.classList.remove('hidden');
    } else {
        if (showOptionsBtn) showOptionsBtn.classList.add('hidden');
        if (revealAnswerBtn) revealAnswerBtn.classList.add('hidden');
        if (optionsGrid) optionsGrid.classList.remove('hidden');
        if (qText) qText.classList.remove('hidden');
        if (qActionBar && !questionData.isMultiPhase) {
            qActionBar.classList.add('hidden');
        }
    }

    // Update terminal tab title if present
    const termTab = document.getElementById('terminal-tab-title');
    if (termTab) {
        const ext = detectCodeLanguage(questionData.text, '');
        termTab.innerText = `question_${String(questionData.id).padStart(2, '0')}.${ext}`;
    }

    // Populate Question Data
    if (qText) qText.innerHTML = formatQuestionText(questionData.id, questionData.text);

    // Handle Question Media
    if (qMedia) {
        qMedia.innerHTML = '';
        if (questionData.image) {
            const img = document.createElement('img');
            img.src = questionData.image;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '400px';
            img.style.borderRadius = '10px';
            img.style.marginBottom = '1.5rem';
            img.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
            qMedia.appendChild(img);
            qMedia.classList.remove('hidden');
        } else if (questionData.video) {
            const video = document.createElement('video');
            video.src = questionData.video;
            video.controls = true;
            video.muted = questionData.muted || false;
            video.style.maxWidth = '100%';
            video.style.borderRadius = '10px';
            video.style.marginBottom = '1.5rem';
            qMedia.appendChild(video);
            qMedia.classList.remove('hidden');
            if (video.muted) {
                console.log("[DEBUG] Video is muted for Question Phase");
            }
        } else {
            qMedia.classList.add('hidden');
        }
    }

    // Auto-detect code to apply monospace font
    const codeMarkers = ['\n', '#include', 'class ', 'def ', 'public ', 'int ', 'while', '{', '}'];
    const isCode = codeMarkers.some(marker => questionData.text.includes(marker));
    if (qText) {
        if (isCode) {
            qText.classList.add('code-font');
        } else {
            qText.classList.remove('code-font');
        }
    }

    const optionPrefixes = ['A', 'B', 'C', 'D'];
    optionButtons.forEach((btn, index) => {
        if (!btn) return;
        if (questionData.options && questionData.options[index]) {
            btn.innerHTML = `<span>${optionPrefixes[index]}. ${questionData.options[index]}</span>`;
            btn.style.background = '';
            btn.style.color = 'var(--text-color)';
            btn.disabled = false;
            if (btn.parentElement) btn.parentElement.classList.remove('hidden');
        } else {
            if (btn.parentElement) btn.parentElement.classList.add('hidden');
        }
    });

    // Reset Options Grid visibility if needed
    if (optionsGrid) {
        if (!questionData.options) {
            optionsGrid.classList.add('hidden');
        } else if (STATE.currentRound !== 4) {
            optionsGrid.classList.remove('hidden');
        }
    }

    // Reset Timer
    const timerControls = document.querySelector('.timer-controls');
    if (timerControls) timerControls.style.display = 'flex';

    const revExpBtn = document.getElementById('review-explanation-btn');
    if (revExpBtn) revExpBtn.classList.add('hidden');

    STATE.timerValue = 60;
    STATE.isTimerPaused = false;
    const pauseBtn = document.getElementById('pause-timer-btn');
    if (pauseBtn) pauseBtn.innerHTML = SVG_PAUSE_ICON;
    updateTimerDisplay();
    startTimer();

    // Zoom/Center background removed

    // Switch UI
    console.log(`[DEBUG] Switching UI to Question Active Screen`);
    document.body.classList.add('active-question');
    if (overlay) overlay.classList.add('hidden');

    // Multi-phase handling: Hide timer and Reveal button, show Next Part button
    const nextPartBtn = document.getElementById('next-part-btn');
    if (questionData.isMultiPhase) {
        clearInterval(STATE.timerInterval);
        if (timerControls) timerControls.style.display = 'none';
        if (revealAnswerBtn) revealAnswerBtn.classList.add('hidden');
        if (nextPartBtn) nextPartBtn.classList.remove('hidden');
        console.log("[DEBUG] Multi-phase question: waiting for Next Part click.");
    } else {
        if (nextPartBtn) nextPartBtn.classList.add('hidden');
        // Standard start timer logic already called above
    }

    showScreen(screenQuestionActive);
}

function showNextPart() {
    console.log(`[DEBUG] Transitioning to Next Part for Q: ${STATE.currentQuestionId}`);
    const questionData = QUIZ_DATA[STATE.currentRound].find(q => q.id === STATE.currentQuestionId);

    const qText = document.getElementById('question-text');
    const nextPartBtn = document.getElementById('next-part-btn');
    const revealAnswerBtn = document.getElementById('reveal-answer-btn');
    const timerControls = document.querySelector('.timer-controls');

    if (qText && questionData.secondQuestionText) {
        qText.innerHTML = `Q${questionData.id}. ${questionData.secondQuestionText}`;
    }

    const qMedia = document.getElementById('question-media');
    if (qMedia) qMedia.classList.add('hidden');

    if (nextPartBtn) nextPartBtn.classList.add('hidden');
    if (revealAnswerBtn) revealAnswerBtn.classList.remove('hidden');

    if (timerControls) timerControls.style.display = 'flex';

    // Start 1-minute timer now
    STATE.timerValue = 60;
    STATE.isTimerPaused = false;
    updateTimerDisplay();
    startTimer();
}

function goBackToQuestionSelection() {
    clearInterval(STATE.timerInterval);
    overlay.classList.add('hidden');

    optionButtons.forEach(btn => btn.disabled = false);

    document.body.classList.remove('active-question');
    document.body.classList.remove('correct-bg', 'incorrect-bg'); // Safety reset

    // Reset Zoom/Center removed

    renderQuestionGrid(STATE.currentRound); // Re-render to show disabled answered questions
    showScreen(screenQuestionSelection);
}

function viewAnsweredQuestion(questionId) {
    STATE.currentQuestionId = parseInt(questionId);
    const questionData = QUIZ_DATA[STATE.currentRound].find(q => q.id === STATE.currentQuestionId);

    // Handle Media Consistency
    const mediaContainer = document.getElementById('question-media');
    mediaContainer.innerHTML = '';
    if (questionData.image) {
        mediaContainer.classList.remove('hidden');
        const img = document.createElement('img');
        img.src = questionData.image;
        mediaContainer.appendChild(img);
    } else if (questionData.video) {
        mediaContainer.classList.remove('hidden');
        const video = document.createElement('video');
        video.src = questionData.video;
        video.controls = true;
        mediaContainer.appendChild(video);
    } else {
        mediaContainer.classList.add('hidden');
    }

    // Ensure everything is visible for review
    document.getElementById('show-options-btn').classList.add('hidden');
    document.getElementById('options-grid').classList.remove('hidden');
    document.getElementById('question-text').classList.remove('hidden');

    // Find the history entry
    const historyEntry = STATE.history.find(h => h.round === STATE.currentRound && h.questionId === STATE.currentQuestionId);

    // Populate Question Data
    questionText.innerHTML = `Q${questionData.id}. ${questionData.text}`;

    // Auto-detect code
    const codeMarkers = ['\n', '#include', 'class ', 'def ', 'public ', 'int ', 'while', '{', '}'];
    const isCode = codeMarkers.some(marker => questionData.text.includes(marker));
    if (isCode) {
        questionText.classList.add('code-font');
    } else {
        questionText.classList.remove('code-font');
    }

    const optionPrefixes = ['A', 'B', 'C', 'D'];
    optionButtons.forEach((btn, index) => {
        btn.innerHTML = `<span>${optionPrefixes[index]}. ${questionData.options[index]}</span>`;
        btn.disabled = true; // prevent clicking

        if (historyEntry) {
            if (index === historyEntry.correctIndex) {
                btn.style.background = 'var(--success)';
                btn.style.color = '#111';
            } else if (index === historyEntry.selectedIndex && !historyEntry.isCorrect) {
                btn.style.background = 'var(--accent)';
                btn.style.color = '#fff';
            } else {
                btn.style.background = '';
                btn.style.color = 'var(--text-color)';
            }
        }
    });

    // Disable timer controls
    document.querySelector('.timer-controls').style.display = 'none';
    document.getElementById('review-explanation-btn').classList.remove('hidden');

    timerDisplay.innerText = historyEntry && historyEntry.team ? `Ans: T${historyEntry.team}` : 'Answered';
    timerDisplay.style.color = '#fff';
    timerDisplay.style.animation = 'none';
    // Zoom/Center background removed

    // Switch UI
    document.body.classList.add('active-question');
    overlay.classList.add('hidden');
    showScreen(screenQuestionActive);
}
// Timer Logic
function startTimer() {
    clearInterval(STATE.timerInterval);
    STATE.timerInterval = setInterval(() => {
        STATE.timerValue--;
        updateTimerDisplay();

        if (STATE.timerValue <= 0) {
            clearInterval(STATE.timerInterval);
            timeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(STATE.timerValue / 60);
    const secs = STATE.timerValue % 60;
    timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (STATE.timerValue <= 10) {
        timerDisplay.style.color = 'var(--accent)';
        timerDisplay.style.animation = 'pulse 1s infinite';
    } else {
        timerDisplay.style.color = '#fff';
        timerDisplay.style.animation = 'none';
    }
}

function addTime(seconds) {
    STATE.timerValue += seconds;
    updateTimerDisplay();
}

const SVG_PAUSE_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
const SVG_PLAY_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

function toggleTimer() {
    const pauseBtn = document.getElementById('pause-timer-btn');
    if (STATE.isTimerPaused) {
        // Resume
        STATE.isTimerPaused = false;
        if (pauseBtn) pauseBtn.innerHTML = SVG_PAUSE_ICON;
        startTimer();
    } else {
        // Pause
        STATE.isTimerPaused = true;
        if (pauseBtn) pauseBtn.innerHTML = SVG_PLAY_ICON;
        clearInterval(STATE.timerInterval);
    }
}

function showResultOverlay(type, teamIndex, points = 10) {
    const h2 = overlay.querySelector('h2');
    if (!h2) return;

    const teamNum = teamIndex || STATE.activeTeam || 1;
    const teamBadgeHTML = `<span class="team-highlight-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Team ${teamNum}</span>`;

    const isRound1 = STATE.currentRound === 1;
    const isRound2 = STATE.currentRound === 2;
    const correctEmoji = isRound1 ? '🤠' : (isRound2 ? '💻' : '🎉');
    const timeoutEmoji = isRound1 ? '⏳' : (isRound2 ? '⏰' : '⏱️');

    if (type === 'correct') {
        const pointsBadgeHTML = `<span class="points-highlight-badge points-win">+${points} Points</span>`;
        const titleText = isRound1 ? "Correct!" : `Correct! ${correctEmoji}`;
        h2.innerHTML = `
            <span class="overlay-title correct-title">${titleText}</span>
            <div class="overlay-highlight-row">
                ${pointsBadgeHTML} <span>awarded to</span> ${teamBadgeHTML}
            </div>
        `;
    } else if (type === 'timeup') {
        const zeroPointsBadgeHTML = `<span class="points-highlight-badge points-zero">0 Points</span>`;
        const titleText = isRound1 ? "Time's Up!" : `${timeoutEmoji} Time's Up!`;
        h2.innerHTML = `
            <span class="overlay-title timeout-title">${titleText}</span>
            <div class="overlay-highlight-row">
                ${teamBadgeHTML} <span>gets</span> ${zeroPointsBadgeHTML}
            </div>
        `;
    } else {
        const zeroPointsBadgeHTML = `<span class="points-highlight-badge points-zero">0 Points</span>`;
        h2.innerHTML = `
            <span class="overlay-title wrong-title">Wrong!</span>
            <div class="overlay-highlight-row">
                ${teamBadgeHTML} <span>gets</span> ${zeroPointsBadgeHTML}
            </div>
        `;
    }

    overlay.classList.remove('hidden');
}

function timeUp() {
    showResultOverlay('timeup', STATE.activeTeam);
    markQuestionAnswered();
}

function checkAnswer(selectedIndex) {
    clearInterval(STATE.timerInterval); // Stop the timer

    const questionData = QUIZ_DATA[STATE.currentRound]?.find(q => q.id === STATE.currentQuestionId);
    if (!questionData) {
        console.error(`[ERROR] Question data not found for ID ${STATE.currentQuestionId} in Round ${STATE.currentRound}`);
        return;
    }

    const isCorrect = selectedIndex === questionData.correctOptionIndex;

    // Highlight options
    optionButtons.forEach((btn, idx) => {
        if (idx === questionData.correctOptionIndex) {
            btn.style.background = 'var(--success)';
            btn.style.color = '#111';
        } else if (idx === selectedIndex && !isCorrect) {
            btn.style.background = 'var(--accent)';
            btn.style.color = '#fff';
        }
        btn.disabled = true; // prevent multiple clicks
    });

    // Record history
    STATE.history.push({
        round: STATE.currentRound,
        questionId: STATE.currentQuestionId,
        text: questionData.text,
        options: questionData.options,
        correctIndex: questionData.correctOptionIndex,
        selectedIndex: selectedIndex,
        team: STATE.activeTeam,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        document.body.classList.remove('incorrect-bg');
        document.body.classList.add('correct-bg');
        awardPoints(STATE.activeTeam);
    } else {
        document.body.classList.remove('correct-bg');
        document.body.classList.add('incorrect-bg');
        setTimeout(() => {
            showResultOverlay('wrong', STATE.activeTeam);
            markQuestionAnswered();
        }, 1500);
    }
}

// Score Persistence Helpers
function saveScores() {
    try {
        localStorage.setItem('quiz_team_scores', JSON.stringify(STATE.scores));
    } catch (e) {
        console.error('Failed to save scores:', e);
    }
}

function loadScores() {
    try {
        const saved = localStorage.getItem('quiz_team_scores');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 8) {
                STATE.scores = parsed;
            }
        }
    } catch (e) {
        console.error('Failed to load scores:', e);
    }
    updateScoreboardUI();
}

function updateScoreboardUI() {
    [1, 2, 3, 4, 5, 6, 8].forEach(teamIndex => {
        const el = document.getElementById(`score-t${teamIndex}`);
        if (el) {
            el.innerText = STATE.scores[teamIndex - 1] || 0;
        }
    });
}

function resetScores() {
    if (confirm("Are you sure you want to reset all team scores to 0?")) {
        STATE.scores = [0, 0, 0, 0, 0, 0, 0, 0];
        try {
            localStorage.removeItem('quiz_team_scores');
        } catch (e) { }
        updateScoreboardUI();
    }
}

// Scoring Logic
function awardPoints(teamIndex) {
    // teamIndex is 1-6 or 8
    const pointsToAdd = 10; // Default points, can be adjusted
    STATE.scores[teamIndex - 1] += pointsToAdd;

    // Update & Save Scoreboard UI
    updateScoreboardUI();
    saveScores();

    setTimeout(() => {
        // Show success overlay
        showResultOverlay('correct', teamIndex, pointsToAdd);
        markQuestionAnswered();
        setTimeout(() => document.body.classList.remove('correct-bg'), 1000);
    }, 1500);
}

function markQuestionAnswered() {
    const key = `${STATE.currentRound}-${STATE.currentQuestionId}`;
    STATE.answeredQuestions.add(key);
}

// Explanation Logic
function openExplanation() {
    const questionData = QUIZ_DATA[STATE.currentRound].find(q => q.id === STATE.currentQuestionId);
    document.getElementById('exp-question-text').innerHTML = formatQuestionText(questionData.id, questionData.text);
    document.getElementById('exp-text').innerHTML = questionData.explanation;

    // Handle Manual Scoring Buttons for Round 4
    const manualControls = document.getElementById('fun-manual-controls');
    const expManualControls = document.getElementById('exp-manual-controls');

    if (manualControls) {
        manualControls.classList.add('hidden');
        manualControls.style.display = 'none';
    }

    if (expManualControls) {
        if (STATE.currentRound === 4) {
            expManualControls.classList.remove('hidden');
            expManualControls.style.display = 'flex';
        } else {
            expManualControls.classList.add('hidden');
            expManualControls.style.display = 'none';
        }
    }

    document.getElementById('question-overlay').classList.add('hidden');
    showScreen(document.getElementById('screen-explanation'));
}

function awardPointsManual(isCorrect) {
    console.log(`[DEBUG] awardPointsManual: isCorrect=${isCorrect}, team=${STATE.activeTeam}`);
    if (isCorrect) {
        awardPoints(STATE.activeTeam);
    } else {
        showResultOverlay('wrong', STATE.activeTeam);
        markQuestionAnswered();
    }

    // Go back to question selection after a brief delay
    setTimeout(() => {
        goBackToQuestionSelection();
    }, 2000);
}

function closeExplanation() {
    showScreen(document.getElementById('screen-question-active'));
}

function revealOptions() {
    document.getElementById('show-options-btn').classList.add('hidden');
    document.getElementById('options-grid').classList.remove('hidden');
    document.getElementById('question-text').classList.remove('hidden');
}

function revealAnswer() {
    console.log(`[DEBUG] Revealing Answer for Q: ${STATE.currentQuestionId}`);
    const questionData = QUIZ_DATA[STATE.currentRound].find(q => q.id === STATE.currentQuestionId);

    // Hide Question
    const qMediaArea = document.getElementById('question-media-area');
    const revealAnsBtn = document.getElementById('reveal-answer-btn');
    if (qMediaArea) qMediaArea.classList.add('hidden');
    if (revealAnsBtn) revealAnsBtn.classList.add('hidden');

    // Populate Answer
    const answerMedia = document.getElementById('answer-media');
    const answerText = document.getElementById('answer-text');
    if (answerMedia) {
        answerMedia.innerHTML = '';
        if (questionData.answerImage) {
            const img = document.createElement('img');
            img.src = questionData.answerImage;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            img.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
            answerMedia.appendChild(img);
        } else if (questionData.answerVideo) {
            const video = document.createElement('video');
            video.src = questionData.answerVideo;
            video.controls = true;
            video.style.maxWidth = '100%';
            answerMedia.appendChild(video);
        }
    }

    if (answerText) {
        answerText.innerHTML = questionData.answerText || "No answer text provided.";
    }

    // Show Answer Content
    const answerContent = document.getElementById('answer-content');
    if (answerContent) answerContent.classList.remove('hidden');

    const manualControls = document.getElementById('fun-manual-controls');
    if (STATE.currentRound === 4 && manualControls) {
        manualControls.classList.remove('hidden');
        manualControls.style.display = 'flex';
    }
}

function showDebateRoundView() {
    const parentGrid = document.getElementById('debate-split-grid');
    if (!parentGrid) return;
    
    let leftColHtml = '';
    let rightColHtml = '';
    
    QUIZ_DATA[3].forEach((item, idx) => {
        const cardId = `pane-${idx + 1}`;
        const topicHeading = `${item.type.toUpperCase()} TOPIC #${idx + 1}`;
        const topicText = item.topic.replace(/^\d+\.\s*/, '');
        
        let guidelinesHtml = '';
        if (item.type.toLowerCase().includes("teach a skill")) {
            const guidelines = [
                "Explain the skill clearly in 1 minute",
                "Use simple, easy-to-follow steps",
                "Focus on memorability and key takeaways"
            ];
            const listItems = guidelines.map(g => `<li>${g}</li>`).join('');
            guidelinesHtml = `
                <h4 class="guidelines-title">Guidelines</h4>
                <ul class="guidelines-list">
                    ${listItems}
                </ul>
            `;
        }
        
        const cardHtml = `
            <div class="topic-paper-card" id="${cardId}" style="margin-bottom: 0.8rem;">
                <div id="${cardId}-content">
                    <h3 class="topic-title">${topicHeading}</h3>
                    <div class="topic-meta">${item.type.toUpperCase()}</div>
                    <div class="topic-quote">
                        <p>"${topicText}"</p>
                    </div>
                    ${guidelinesHtml}
                </div>
            </div>
        `;
        
        if (idx % 2 === 0) {
            leftColHtml += cardHtml;
        } else {
            rightColHtml += cardHtml;
        }
    });
    
    parentGrid.innerHTML = `
        <div class="topics-column">${leftColHtml}</div>
        <div class="topics-column">${rightColHtml}</div>
    `;

    showScreen(document.getElementById('screen-debate-round'));
}

function goBackToQuizSelectionFromDebate() {
    hideAllBackgrounds();
    document.body.classList.add('lobby-active');
    showScreen(screenQuizSelection);
    activateMorphRound(selectedMorphRound);
}

// Carousel Logic removed

// Quick helper animation and dynamic styles injection for CSS overrides
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); text-shadow: 0 0 20px #ff4757; }
    100% { transform: scale(1); }
  }
  
  body.round-3-active #scoreboard:not(.horizontal-layout) {
      width: 108px !important;
  }
  body.round-3-active .scoreboard-toolbar {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0.4rem !important;
      width: 100% !important;
      padding: 0.4rem 0.2rem !important;
      border-bottom: 1.5px solid var(--ink-soft) !important;
      background: transparent !important;
  }
  body.round-3-active .scoreboard-drag-handle {
      flex: none !important;
      width: 24px !important;
      height: 24px !important;
      color: var(--ink) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      background: transparent !important;
      border: 1px solid var(--ink) !important;
      cursor: grab !important;
  }
  body.round-3-active .scoreboard-drag-handle svg {
      display: block !important;
      width: 12px !important;
      height: 12px !important;
      fill: var(--ink) !important;
  }
  body.round-3-active .sb-tool-btn {
      flex: none !important;
      width: 24px !important;
      height: 24px !important;
      border: 1px solid var(--ink) !important;
      background-color: transparent !important;
      color: var(--ink) !important;
      border-radius: 0px !important;
      padding: 0 !important;
      box-shadow: none !important;
      text-shadow: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      transition: background-color 0.2s ease !important;
  }
  body.round-3-active .sb-tool-btn:hover {
      background-color: var(--ink) !important;
      color: var(--paper) !important;
  }
  body.round-3-active .sb-tool-btn svg {
      display: block !important;
      width: 12px !important;
      height: 12px !important;
      stroke: var(--ink) !important;
      stroke-width: 2.5px !important;
      fill: none !important;
  }
  body.round-3-active .sb-tool-btn:hover svg {
      stroke: var(--paper) !important;
  }
  body.round-3-active #sb-orient-btn::before,
  body.round-3-active #sb-reset-btn::before {
      display: none !important;
      content: "" !important;
  }
`;
document.head.appendChild(styleSheet);

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('lobby-active');
    initInteractiveCanvas();
    initDraggableScoreboard();
    loadScores();
    setTimeout(() => {
        activateMorphRound(1);
    }, 100);
});

// Watermark and Dynamic Cursor Tracking Helpers
function updateWatermark(teamIndex) {
    const watermark = document.getElementById('bg-watermark');
    if (watermark) {
        if (teamIndex) {
            const text = `Team ${teamIndex}`;
            watermark.textContent = text;
            watermark.setAttribute('data-text', text);
            watermark.classList.add('active');
        } else {
            watermark.textContent = '';
            watermark.removeAttribute('data-text');
            watermark.classList.remove('active');
        }
    }
}

function getThemeColor() {
    if (document.body.classList.contains('incorrect-bg')) {
        return { r: 255, g: 45, b: 65 }; // Vibrant Red for Wrong Answer
    }
    if (document.body.classList.contains('correct-bg')) {
        return { r: 0, g: 255, b: 102 }; // Vibrant Green for Correct Answer
    }
    return { r: 229, g: 152, b: 80 }; // Warm Bronze for Round 1
}

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    mouseX = x;
    mouseY = y;
    document.documentElement.style.setProperty('--mouse-x', `${x}px`);
    document.documentElement.style.setProperty('--mouse-y', `${y}px`);
});

function initInteractiveCanvas() {
    const canvas = document.getElementById('bg-interactive');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });

    function drawGrid() {
        ctx.clearRect(0, 0, width, height);
        const spacing = 40;
        const theme = getThemeColor();
        const maxDist = 240;
        const maxDistSq = maxDist * maxDist;
        const isAnswerFeedback = document.body.classList.contains('incorrect-bg') || document.body.classList.contains('correct-bg');

        for (let x = spacing / 2; x < width; x += spacing) {
            for (let y = spacing / 2; y < height; y += spacing) {
                const dx = mouseX - x;
                const dy = mouseY - y;
                const distSq = dx * dx + dy * dy;

                let alpha = isAnswerFeedback ? 0.35 : 0.15;
                let size = isAnswerFeedback ? 2.2 : 1.5;

                if (distSq < maxDistSq) {
                    const proximity = 1 - Math.sqrt(distSq) / maxDist;
                    alpha += proximity * (isAnswerFeedback ? 0.6 : 0.45);
                    size += proximity * 2.5;
                }

                ctx.fillStyle = `rgba(${theme.r}, ${theme.g}, ${theme.b}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        requestAnimationFrame(drawGrid);
    }
    requestAnimationFrame(drawGrid);
}

/* Draggable, Resizable & Orientation-Switchable Scoreboard Controller */
function initDraggableScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    const dragHandle = scoreboard.querySelector('.scoreboard-drag-handle') || scoreboard;

    dragHandle.addEventListener('mousedown', (e) => {
        if (e.target.closest('.sb-tool-btn')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = scoreboard.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        scoreboard.style.transform = 'none';
        scoreboard.style.left = `${initialLeft}px`;
        scoreboard.style.top = `${initialTop}px`;
        scoreboard.classList.add('is-dragging');

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // Touch support for mobile/tablet devices
    dragHandle.addEventListener('touchstart', (e) => {
        if (e.target.closest('.sb-tool-btn')) return;
        const touch = e.touches[0];
        if (!touch) return;

        isDragging = true;
        startX = touch.clientX;
        startY = touch.clientY;

        const rect = scoreboard.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        scoreboard.style.transform = 'none';
        scoreboard.style.left = `${initialLeft}px`;
        scoreboard.style.top = `${initialTop}px`;
        scoreboard.classList.add('is-dragging');

        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
    }, { passive: true });

    function onMouseMove(e) {
        if (!isDragging) return;
        moveScoreboard(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
        if (!isDragging) return;
        const touch = e.touches[0];
        if (touch) {
            e.preventDefault();
            moveScoreboard(touch.clientX, touch.clientY);
        }
    }

    function moveScoreboard(clientX, clientY) {
        const dx = clientX - startX;
        const dy = clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        const maxLeft = window.innerWidth - scoreboard.offsetWidth;
        const maxTop = window.innerHeight - scoreboard.offsetHeight;

        newLeft = Math.max(10, Math.min(newLeft, maxLeft - 10));
        newTop = Math.max(10, Math.min(newTop, maxTop - 10));

        scoreboard.style.left = `${newLeft}px`;
        scoreboard.style.top = `${newTop}px`;
    }

    function onMouseUp() {
        if (isDragging) {
            isDragging = false;
            scoreboard.classList.remove('is-dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    function onTouchEnd() {
        if (isDragging) {
            isDragging = false;
            scoreboard.classList.remove('is-dragging');
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        }
    }
}

function toggleScoreboardOrientation() {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard) return;

    scoreboard.classList.toggle('horizontal-layout');
}

// Screen-Morphing Console selector functions
let selectedMorphRound = 1;

function activateMorphRound(roundId) {
    selectedMorphRound = roundId;
    
    const container = document.getElementById('screen-quiz-selection');
    const items = document.querySelectorAll('.morph-menu-item');
    const launchBtn = document.getElementById('morph-launch-btn');
    
    if (!container) return;
    
    // Clear and set morph preview classes on document.body
    document.body.classList.remove('morph-preview-1', 'morph-preview-2', 'morph-preview-3', 'morph-preview-4');
    document.body.classList.add(`morph-preview-${roundId}`);

    // Update container classes
    container.className = 'screen active'; // reset
    container.classList.add(`morph-preview-${roundId}`);
    
    // Highlight the selected menu item
    items.forEach(item => {
        const itemRound = parseInt(item.getAttribute('data-quiz'));
        if (itemRound === roundId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update the big launcher button CTA styling details dynamically
    if (launchBtn) {
        if (roundId === 1) {
            launchBtn.innerText = "LAUNCH APTITUDE TEST";
        } else if (roundId === 2) {
            launchBtn.innerText = "BOOT SYSTEM / START";
        } else if (roundId === 3) {
            launchBtn.innerText = "ENTER DEBATE ARENA";
        } else if (roundId === 4) {
            launchBtn.innerText = "START THE CHAOS (FUN ROUND)";
        }
    }
}

function launchMorphRound() {
    openRules(selectedMorphRound);
}
