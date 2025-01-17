// Constants and Global Variables
const maxDegree = 2; // r in RM(r,m)
const numVariables = 4; // m in RM(r,m)
const codeLength = 2 ** numVariables;
let currentStep = 0;
let currentDegree = maxDegree;
let receivedVector = [];
let currentMonomial = [];
let decodedCoefficients = new Map();
let currentFunction = [];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the decoder
    initializeDecoderSimulation();

    // Add click event listeners to buttons
    document.querySelectorAll('#decoding-step button').forEach(button => {
        button.addEventListener('click', function () {
            checkMajorityDecision(parseInt(this.textContent));
        });
    });
});

// Function to generate all possible inputs
function generateAllInputs(numVars) {
    const inputs = [];
    const total = 2 ** numVars;

    for (let i = 0; i < total; i++) {
        const input = [];
        for (let j = 0; j < numVars; j++) {
            input.push((i >> j) & 1);
        }
        inputs.push(input);
    }
    return inputs;
}

// Function to evaluate monomial for given input
function evaluateMonomial(monomial, input) {
    if (monomial.length === 0) return 1;
    return monomial.every(variable => input[variable - 1] === 1);
}

// Function to generate monomials of specific degree
function generateMonomials(degree, m) {
    const monomials = [];

    function generateCombinations(arr, size, start = 0, current = []) {
        if (current.length === size) {
            monomials.push([...current]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            current.push(arr[i]);
            generateCombinations(arr, size, i + 1, current);
            current.pop();
        }
    }

    if (degree === 0) {
        monomials.push([]); // Constant term
    } else {
        const variables = Array.from({ length: m }, (_, i) => i + 1);
        generateCombinations(variables, degree);
    }
    return monomials;
}

// Format monomial for display in latex
// function formatMonomial(monomial) {
//     if (!monomial) return '';
//     if (monomial.length === 0) return '1';
//     return monomial.map(v => `x${v}`).join('');
// }

function formatMonomial(monomial) {
    if (!monomial) return '';
    if (monomial.length === 0) return `\\(1\\)`;
    return `\\(X_{${monomial.join('}X_{')}} \\)`;
}


// Format decoded polynomial in MathJax format
function formatDecodedPolynomial() {
    const terms = [];
    decodedCoefficients.forEach((coeff, monomial) => {
        if (coeff === 1) {
            const monomialArr = monomial ? monomial.split(',').map(Number) : [];
            terms.push(monomialArr);
        }
    });
    return terms.length > 0 ? `\\(f(x) = ${terms.map(v => `X_${v}`).join(' + ')}\\)` : '\\(f(x) = 0\\)';
}

// Initialize the decoder simulation
function initializeDecoderSimulation() {
    // Generate random received vector
    receivedVector = Array.from({ length: codeLength }, () => Math.random() < 0.5 ? 1 : 0);
    currentFunction = [...receivedVector];
    currentDegree = maxDegree;
    currentStep = 0;
    decodedCoefficients.clear();

    // Update UI
    updateUI();
}

// Compute all subcodeword sums for a monomial
function computeAllSubcodewordSums(monomial) {
    const allInputs = generateAllInputs(numVariables);
    const sums = new Map();

    allInputs.forEach((input, idx) => {
        if (evaluateMonomial(monomial, input)) {
            const key = input.filter((_, i) => !monomial.includes(i + 1)).join('');
            const currentSum = sums.get(key) || 0;
            sums.set(key, currentSum ^ currentFunction[idx]);
        }
    });

    return Array.from(sums.values());
}

// Compute majority sum for verification
function computeMajoritySum(monomial, func) {
    const sums = computeAllSubcodewordSums(monomial);
    const onesCount = sums.filter(sum => sum === 1).length;
    return onesCount > sums.length / 2 ? 1 : 0;
}

// Update current function by subtracting monomial contribution
function updateCurrentFunction(monomial) {
    const allInputs = generateAllInputs(numVariables);
    allInputs.forEach((input, idx) => {
        if (evaluateMonomial(monomial, input)) {
            currentFunction[idx] ^= 1;
        }
    });
}

// Function to handle user's majority decision
function checkMajorityDecision(userDecision) {
    const monomials = generateMonomials(currentDegree, numVariables);
    const correctMajority = computeMajoritySum(currentMonomial, currentFunction);

    const feedbackEl = document.getElementById('feedback');

    if (parseInt(userDecision) === correctMajority) {
        // Update decoded coefficients
        decodedCoefficients.set(currentMonomial.join(','), correctMajority);

        // If coefficient is 1, subtract contribution
        if (correctMajority === 1) {
            updateCurrentFunction(currentMonomial);
        }

        // Move to next step
        currentStep++;
        if (currentStep >= monomials.length) {
            currentDegree--;
            currentStep = 0;
            if (currentDegree < 0) {
                displayFinalResults();
                return;
            }
        }

        if (feedbackEl) {
            feedbackEl.innerHTML = 'Correct! Moving to next monomial.';
            feedbackEl.style.color = 'green';
        }
    } else {
        if (feedbackEl) {
            feedbackEl.innerHTML = 'Incorrect. Try again!';
            feedbackEl.style.color = 'red';
        }
        return;
    }

    updateUI();
}

// Modified updateUI function with null checks
function updateUI() {
    const monomials = generateMonomials(currentDegree, numVariables);
    currentMonomial = monomials[currentStep];

    // Add null checks before updating DOM
    const receivedVectorEl = document.getElementById('receivedVector');
    const currentDegreeEl = document.getElementById('currentDegree');
    const currentMonomialEl = document.getElementById('currentMonomial');
    const decodedPolynomialEl = document.getElementById('decodedPolynomial');

    if (receivedVectorEl) receivedVectorEl.innerHTML = `(${receivedVector.join(',')})`;
    if (currentDegreeEl) currentDegreeEl.innerHTML = `Current Degree: ${currentDegree}`;
    if (currentMonomialEl) currentMonomialEl.innerHTML = formatMonomial(currentMonomial);
    if (decodedPolynomialEl) decodedPolynomialEl.innerHTML = formatDecodedPolynomial();

    // Show subcodeword sums for current monomial
    // displaySubcodewordSums(currentMonomial);

    // add null check before calling MathJax.typeset()
    if (window.MathJax && decodedPolynomialEl) {
        MathJax.typeset();
    }
}

// Display final results
function displayFinalResults() {
    const finalResultEl = document.getElementById('finalResult');
    if (finalResultEl) {
        finalResultEl.innerHTML = `
            <h3>Decoding Complete!</h3>
            <p>Final decoded polynomial: ${formatDecodedPolynomial()}</p>
        `;
    }

    if (window.MathJax) {
        MathJax.typeset();
    }
}

// // Modified displaySubcodewordSums function
// function displaySubcodewordSums(monomial) {
//     const sums = computeAllSubcodewordSums(monomial);
//     const sumsContainer = document.getElementById('subcodewordSums');

//     if (sumsContainer) {
//         sumsContainer.innerHTML = `
//             <h4>Subcodeword Sums:</h4>
//             <div class="sums-grid">
//                 ${sums.map((sum, i) => `
//                     <div class="sum-item">
//                         Sum ${i + 1}: ${sum}
//                     </div>
//                 `).join('')}
//             </div>
//         `;
//     }
// }

// Make functions globally available
window.checkMajorityDecision = checkMajorityDecision;
window.initializeDecoderSimulation = initializeDecoderSimulation;