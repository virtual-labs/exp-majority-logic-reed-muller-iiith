// Constants and Global Variables
const maxDegree = 3; // Maximum degree of the monomials (r in RM(r, m))
const numVariables = 4; // Number of variables (m in RM(r, m))
const codeLength = 2 ** numVariables; // Length of the Reed-Muller codeword
let degree = 0; // Degree of the current monomial
let numSubvectors = 2 ** (numVariables - maxDegree); // Number of subvectors for majority decoding
let currentReceivedVector = [];
let selectedVector = [];
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
    const allInputs = generateAllInputs(numVariables);
    currentPolynomial = [];

    for (let i = 0; i <= maxDegree; i++) {
        if (Math.random() < 0.5) {
            const mon = generateRandomMonomial(i);
            currentPolynomial.push(mon);
        }
    }

    console.log("Generated polynomial:", currentPolynomial);
    return evaluatePolynomial(currentPolynomial, allInputs);
}

// Function to create interactive codeword display
function createInteractiveCodeword(codeword, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '5px';
    container.style.justifyContent = 'center';
    container.style.padding = '10px';

    codeword.forEach((bit, index) => {
        const bitElement = document.createElement('button');
        bitElement.className = 'v-button-bit';
        bitElement.style.width = '40px';
        bitElement.style.height = '40px';
        bitElement.style.margin = '2px';
        bitElement.style.display = 'flex';
        bitElement.style.alignItems = 'center';
        bitElement.style.justifyContent = 'center';
        bitElement.style.cursor = 'pointer';
        bitElement.style.transition = 'background-color 0.2s';
        bitElement.textContent = currentReceivedVector[index];

        selectedVector[index] = 0;

        updateBitDisplay(bitElement, 0);

        bitElement.onclick = () => {
            // currentReceivedVector[index] = currentReceivedVector[index] === 0 ? 1 : 0;
            selectedVector[index] = selectedVector[index] === 0 ? 1 : 0;
            updateBitDisplay(bitElement, selectedVector[index]);
            correctSubcodewordSums = generateSubcodewordSums(currentReceivedVector);
        };

        container.appendChild(bitElement);
    });
}

// Helper function to update bit display
function updateBitDisplay(element, value) {
    // element.textContent = value;
    if (value === 1) {
        element.style.backgroundColor = '#3273dc';
        element.style.color = 'white';
    } else {
        element.style.backgroundColor = '#f5f5f5';
        element.style.color = '#363636';
    }
}

// Function to generate subcodeword sums for majority decoding
function generateSubcodewordSums(codeword) {
    const subcodewordSums = [];
    const subvectorSize = codeLength / numSubvectors;

    for (let i = 0; i < numSubvectors; i++) {
        const subvector = codeword.slice(i * subvectorSize, (i + 1) * subvectorSize);
        const sum = subvector.reduce((acc, bit) => acc ^ bit, 0);
        subcodewordSums.push(sum);
    }

    correctMajorityResult = subcodewordSums.filter(x => x === 1).length > numSubvectors / 2 ? 1 : 0;
    return subcodewordSums;
}

// Function to initialize the majority decoder interface
function initializeMajorityDecoder() {
    degree = Math.floor(Math.random() * (maxDegree + 1));
    numSubvectors = 2 ** (numVariables - degree);
    currentMonomial = generateRandomMonomial(degree);
    currentReceivedVector = generateReedMullerCodeword(maxDegree, numVariables);

    document.getElementById('codeword').textContent = `\\( (${currentReceivedVector.join('')}) \\)`;

    // Use interactive codeword display instead of text
    createInteractiveCodeword(currentReceivedVector, 'receivedVector');

    document.getElementById('numSubvectors').textContent = `\\(${numSubvectors}\\)`;
    document.getElementById('monomial').textContent = degree === 0 ? `\\(1\\)` : `\\( X_{${currentMonomial.join('}X_{')}} \\)`;

    // correctSubcodewordSums = generateSubcodewordSums(currentReceivedVector);

    // const inputsContainer = document.querySelector('.subcodeword-inputs');
    // inputsContainer.innerHTML = '';

    // for (let i = 0; i < numSubvectors; i++) {
    //     const input = document.createElement('input');
    //     input.type = 'number';
    //     input.min = '0';
    //     input.max = '1';
    //     input.className = 'subcodeword-input';
    //     input.style.width = '40px';
    //     input.style.height = '40px';
    //     input.style.textAlign = 'center';
    //     input.style.fontSize = '16px';
    //     input.id = `subcodeword-${i}`;
    //     inputsContainer.appendChild(input);
    // }

    // Refresh MathJax rendering
    if (window.MathJax) {
        MathJax.typeset();
    }
}

// check if all selected subcodewords i.e where selectedVector is 1, matches with any subcode coset generated by getSubcodeIndices
function checkSubcode() {

    let allCorrect = false;
    const observations = document.getElementById('observation');
    const nextButton = document.getElementById('nextButton');
    const subcodewords = getSubcodeIndices(currentMonomial);

    // convert selectedVector to index 
    let selectedVectorIndices = selectedVector.map((bit, idx) => bit === 1 ? idx : -1).filter(idx => idx !== -1);

    subcodewords.forEach((subcodeword) => {
        // Sort the subcodeword and selectedVector indices for comparison
        subcodeword.sort((a, b) => a - b);
        selectedVectorIndices.sort((a, b) => a - b);

        // Check if the subcodeword matches the selectedVectorIndices
        const isMatching =
            subcodeword.length === selectedVectorIndices.length &&
            subcodeword.every((value, index) => value === selectedVectorIndices[index]);

        if (isMatching) {
            allCorrect = true;
        }
    });

    console.log(subcodewords);
    console.log(selectedVectorIndices);

    const correctPrompt = "Correct! You have selected a correct subcodeword.";
    const tryAgainPrompt = "Incorrect. Please try again.";
    const wrongAgainPrompt = "You have selected a wrong subcodeword again. Please try again.";

    if (allCorrect) {
        observations.innerHTML = correctPrompt;
        observations.style.color = "green";
        document.getElementById('majorityResult').textContent = correctMajorityResult;
        nextButton.style.display = 'inline-block';
    } else if (observations.innerHTML === tryAgainPrompt) {
        observations.innerHTML = wrongAgainPrompt;
        observations.style.color = "red";
        nextButton.style.display = 'none';
    }
    else {
        observations.innerHTML = tryAgainPrompt;
        observations.style.color = "red";
        nextButton.style.display = 'none';
    }
}

function resetMajorityDecoder() {
    selectedVector = [];
    correctSubcodewordSums = [];
    correctMajorityResult = 0;
    document.getElementById('observation').textContent = '';
    // document.getElementById('majorityResult').textContent = '';
    document.getElementById('nextButton').style.display = 'none';

    initializeMajorityDecoder();

}


function nextMajorityQuestion() {
    resetMajorityDecoder();
    initializeMajorityDecoder();
}
// Helper function to convert index to binary vector
function indexToBinaryVector(index, numVars) {
    return index.toString(2).padStart(numVars, '0').split('').map(Number);
}

// Helper function to convert binary vector to index
function binaryVectorToIndex(vector) {
    return parseInt(vector.join(''), 2);
}

// Helper function to add binary vectors modulo 2
function addVectors(v1, v2) {
    return v1.map((bit, idx) => bit ^ v2[idx]);
}

function getSubcodeIndices(monomial) {
    const subcodeIndices = [];

    // For a single variable monomial X_i, we need to partition based on all other variables
    // For X4, we should fix variables {1,2,3} in all possible combinations
    const fixedVariables = Array.from({ length: numVariables }, (_, i) => i + 1)
        .filter(x => !monomial.includes(x));

    // For X4, with 4 variables total, we should get 2^3 = 8 cosets
    // Because we're fixing 3 variables (1,2,3) in all possible combinations
    const numCosets = 2 ** fixedVariables.length;

    // Generate binary patterns for fixed variables
    for (let i = 0; i < numCosets; i++) {
        let fixedPattern = i.toString(2).padStart(fixedVariables.length, '0').split('').map(Number);
        let subvector = [];

        // Go through all possible input vectors (16 for 4 variables)
        for (let inputIdx = 0; inputIdx < 2 ** numVariables; inputIdx++) {
            let inputVector = inputIdx.toString(2).padStart(numVariables, '0').split('').map(Number);

            // Check if this input matches our fixed pattern for variables 1,2,3
            let matches = true;
            for (let j = 0; j < fixedVariables.length; j++) {
                if (inputVector[fixedVariables[j] - 1] !== fixedPattern[j]) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                subvector.push(inputIdx);
            }
        }

        subcodeIndices.push(subvector);
    }

    return subcodeIndices;
}


// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeMajorityDecoder);