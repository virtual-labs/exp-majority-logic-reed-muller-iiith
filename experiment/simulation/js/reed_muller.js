// Constants and Global Variables
const maxDegree = 3; // Maximum degree of the monomials (r in RM(r, m))
const numVariables = 4; // Number of variables (m in RM(r, m))
const codeLength = 2 ** numVariables; // Length of the Reed-Muller codeword
let numSubvectors = 2 ** (numVariables - maxDegree); // Number of subvectors for majority decoding
let currentReceivedVector = [];
let currentMonomial = [];
let currentPolynomial = [];
let correctSubcodewordSums = [];
let correctMajorityResult = 0;

// Function to evaluate a Boolean polynomial on all inputs
function evaluatePolynomial(polynomial, inputs) {
    const codeword = [];
    for (const input of inputs) {
        let result = 0;
        // polynomial is now an array of monomials, where each monomial is an array of variables
        for (const monomial of polynomial) {
            let monomialResult = 1;
            // If monomial is empty array (constant term 1), keep monomialResult as 1
            if (monomial.length > 0) {
                for (const variable of monomial) {
                    monomialResult *= input[variable - 1];
                }
            }
            result ^= monomialResult; // Use XOR instead of addition modulo 2
        }
        codeword.push(result);
    }
    return codeword;
}

// Function to generate a random monomial of a given degree
function generateRandomMonomial(deg = 1) {
    if (deg === 0) {
        return []; // Return empty array for constant term 1
    }

    const variables = Array.from({ length: numVariables }, (_, i) => i + 1);
    const selectedVars = [];

    for (let i = 0; i < deg; i++) {
        const randomIndex = Math.floor(Math.random() * variables.length);
        selectedVars.push(variables.splice(randomIndex, 1)[0]);
    }

    selectedVars.sort((a, b) => a - b);
    return selectedVars;
}

// Function to generate all possible binary inputs for m variables
function generateAllInputs(m) {
    const inputs = [];
    const totalInputs = 2 ** m;

    for (let i = 0; i < totalInputs; i++) {
        const binary = i.toString(2).padStart(m, '0');
        inputs.push(binary.split('').map(Number));
    }

    return inputs;
}

// Function to generate a Reed-Muller codeword for a given monomial
function generateReedMullerCodeword(maxDegree, numVariables) {
    // Generate all possible binary inputs for the given number of variables
    const allInputs = generateAllInputs(numVariables);

    // Reset the current polynomial
    currentPolynomial = [];

    // Generate random monomials of different degrees and add them to the polynomial
    for (let i = 0; i <= maxDegree; i++) {
        if (Math.random() < 0.5) { // 50% chance to include a monomial of each degree
            const mon = generateRandomMonomial(i);
            currentPolynomial.push(mon); // Add the monomial as a new element in the array
        }
    }

    console.log("Generated polynomial:", currentPolynomial);
    // Evaluate the polynomial on all inputs to generate the codeword
    return evaluatePolynomial(currentPolynomial, allInputs);
}

// Function to generate subcodeword sums for majority decoding
function generateSubcodewordSums(codeword) {
    const subcodewordSums = [];
    const subvectorSize = codeLength / numSubvectors;

    for (let i = 0; i < numSubvectors; i++) {
        const subvector = codeword.slice(i * subvectorSize, (i + 1) * subvectorSize);
        const sum = subvector.reduce((acc, bit) => acc ^ bit, 0); // Use XOR instead of addition modulo 2
        subcodewordSums.push(sum);
    }

    correctMajorityResult = subcodewordSums.filter(x => x === 1).length > numSubvectors / 2 ? 1 : 0;
    return subcodewordSums;
}

// Function to initialize the majority decoder interface
function initializeMajorityDecoder() {
    // Generate and display received vector
    const degree = Math.floor(Math.random() * (maxDegree + 1));
    numSubvectors = 2 ** (numVariables - degree);
    currentMonomial = generateRandomMonomial(degree);
    currentReceivedVector = generateReedMullerCodeword(maxDegree, numVariables);
    document.getElementById('receivedVector').textContent =
        `(${currentReceivedVector.join(',')})`;
    document.getElementById('numSubvectors').textContent = `\\(${numSubvectors}\\)`;

    // Display the monomial in form MathJax X_{i1}X_{i2}...X_{ik} and 1 if degree is zero 
    document.getElementById('monomial').textContent = degree === 0 ? `\\(1\\)` : `\\( X_{${currentMonomial.join('}X_{')}} \\)`;

    // Generate correct subcodeword sums
    correctSubcodewordSums = generateSubcodewordSums(currentReceivedVector);

    // Create input boxes for subcodeword sums
    const inputsContainer = document.querySelector('.subcodeword-inputs');
    inputsContainer.innerHTML = '';

    for (let i = 0; i < numSubvectors; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = '1';
        input.className = 'subcodeword-input';
        input.style.width = '40px';
        input.style.height = '40px';
        input.style.textAlign = 'center';
        input.style.fontSize = '16px';
        input.id = `subcodeword-${i}`;
        inputsContainer.appendChild(input);
    }
}

// Rest of the functions remain unchanged
function checkMajorityDecoded() {
    const inputs = document.querySelectorAll('.subcodeword-input');
    const userAnswers = Array.from(inputs).map(input => parseInt(input.value) || 0);

    let allCorrect = true;
    inputs.forEach((input, index) => {
        if (userAnswers[index] !== correctSubcodewordSums[index]) {
            allCorrect = false;
            input.style.backgroundColor = '#ffebee';
        } else {
            input.style.backgroundColor = '#e8f5e9';
        }
    });

    const observations = document.getElementById('observation');
    const nextButton = document.getElementById('nextButton');

    if (allCorrect) {
        observations.innerHTML = "Correct! The majority logic decoding gives the right result.";
        observations.style.color = "green";
        document.getElementById('majorityResult').textContent = correctMajorityResult;
        nextButton.style.display = 'inline-block';
    } else {
        observations.innerHTML = "Incorrect. Please check your subcodeword sums.";
        observations.style.color = "red";
        nextButton.style.display = 'none';
    }
}

function resetMajorityDecoder() {
    document.querySelectorAll('.subcodeword-input').forEach(input => {
        input.value = '';
        input.style.backgroundColor = '';
    });
    document.getElementById('majorityResult').textContent = '';
    document.getElementById('observation').innerHTML = '';
    document.getElementById('nextButton').style.display = 'none';
}

function nextMajorityQuestion() {
    resetMajorityDecoder();
    initializeMajorityDecoder();
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeMajorityDecoder);