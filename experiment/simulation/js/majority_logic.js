// Constants and Global Variables
const maxDegree = 2; // r in RM(r,m)
const numVariables = 4; // m in RM(r,m)
const codeLength = 2 ** numVariables;
let currentStep = 0;
let currentDegree = maxDegree;
let receivedVector = [];
let sentVector = [];
let currentVector = [];
let currentMonomial = [];
let decodedCoefficients = new Map();
let currentFunction = [];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the decoder
    initializeDecoderSimulation();

    // Add click event listeners to buttons
    // document.querySelectorAll('#decoding-step button').forEach(button => {
    //     button.addEventListener('click', function () {
    //         checkMajorityDecision(parseInt(this.textContent));
    //     });
    // });
});

// Add event listener for reset button
document.getElementById('resetButton').addEventListener('click', function () {
    location.reload();
});

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

// Function to evaluate monomial for a given input vector
function evaluateMonomial(monomial, input) {
    return input.map(inputVector => {
        let result = 1;
        if (monomial.length > 0) {
            for (const variable of monomial) {
                result *= inputVector[variable - 1];
            }
        }
        return result;
    });
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



// Format decoded polynomial in MathJax format
function formatDecodedPolynomial() {
    const terms = [];
    decodedCoefficients.forEach((coeff, monomial) => {
        if (coeff === 1) {
            const monomialArr = monomial ? monomial.split(',').map(Number) : [];
            const formattedMonomial = monomialArr.length > 0
                ? monomialArr.map(v => `X_${v}`).join(' ')
                : '1'; // Constant term
            terms.push(formattedMonomial);
        }
    });
    return terms.length > 0
        ? `\\(f(x) = ${terms.join(' + ')}\\)`
        : '\\(f(x) = 0\\)';
}


// Initialize the decoder simulation
function initializeDecoderSimulation() {
    // Generate random RM codeword by evaluating polynomal 
    sentVector = generateReedMullerCodeword(maxDegree, numVariables);
    // flip less than 2^(m-r-1) bits
    // Calculate the number of bits to flip (less than 2^(m-r-1))
    const numBitsToFlip = 1;

    console.log('Sent vector:', sentVector);
    console.log('Number of bits to flip:', numBitsToFlip);

    // Make a copy of the sentVector and introduce errors
    receivedVector = [...sentVector];
    for (let i = 0; i < numBitsToFlip; i++) {
        const randomIndex = Math.floor(Math.random() * receivedVector.length);
        receivedVector[randomIndex] = 1 - receivedVector[randomIndex]; // Flip the bit
    }

    // currentFunction = [...receivedVector];
    currentDegree = maxDegree;
    currentStep = 0;
    decodedCoefficients.clear();

    // currentVector = receivedVector make a deep copy
    currentVector = [...receivedVector];


    // Update UI
    updateUI();
}

// Compute majority of subcodeword sums for a monomial from current vector
function computeAllSubcodewordSums(monomial) {
    const allInputs = generateAllInputs(numVariables);
    const subcodeIndices = getSubcodeIndices(monomial);
    const sums = [];

    subcodeIndices.forEach(subvector => {
        let sum = 0;
        subvector.forEach(idx => {
            sum ^= currentVector[idx];
        });

        sums.push(sum);
    }
    );

    return sums;
}


// Compute majority sum for verification
function computeMajoritySum(monomial, func) {
    const sums = computeAllSubcodewordSums(monomial);
    const onesCount = sums.filter(sum => sum === 1).length;
    return onesCount > sums.length / 2 ? 1 : 0;
}

// Update current function by subtracting monomial contribution
function updateCurrentFunction(monomial) {

    console.log('currentVector:', currentVector);

    const allInputs = generateAllInputs(numVariables);
    const evalMonomial = evaluateMonomial(monomial, allInputs);
    allInputs.forEach((input, idx) => {
        currentVector[idx] ^= evalMonomial[idx];
    });

    console.log('Updated current vector:', currentVector);
    console.log('evalMonomial:', evalMonomial);
}

document.getElementById('submitDecision').addEventListener('click', function () {
    // 1. Get the selected value
    const selectedRadio = document.querySelector('input[name="majority_choice"]:checked');

    if (selectedRadio) {
        // const userDecision = parseInt(selectedRadio.value);
        // 2. Call the existing check function with the selected value
        checkMajorityDecision(selectedRadio.value);
    } else {
        // Handle case where no choice is made
        alert("Please select a coefficient (0 or 1).");
    }
});

// Function to handle user's majority decision
function checkMajorityDecision(userDecision) {
    const monomials = generateMonomials(currentDegree, numVariables);
    const correctMajority = computeMajoritySum(currentMonomial, currentFunction);

    const observation = document.getElementById('observation');

    const correctPrompt = `Yes, the majority of the subcodeword sums for the monomial ${formatMonomial(currentMonomial)} is ${correctMajority}.`;
    const incorrectPrompt = `No, you have selected the wrong majority for the subcodeword sums (a subcodeword sum is a sum of bits of each check set) for the monomial ${formatMonomial(currentMonomial)}. Try again, if necessary, study the theory part and repeat part-1 of this experiment once more, before trying again.`;
    const repeatPrompt = `Please try again!`;

    console.log('User decision:', parseInt(userDecision));
    console.log('Correct majority:', correctMajority);

    if (parseInt(userDecision) === correctMajority) {

        console.log('User decision is correct.');

        // Update decoded coefficients
        decodedCoefficients.set(currentMonomial.join(','), correctMajority);

        // If coefficient is 1, subtract contribution
        if (correctMajority === 1) {
            updateCurrentFunction(currentMonomial);
        }

        console.log('Decoded coefficients:', decodedCoefficients);

        // Move to next step
        currentStep++;
        if (currentStep >= monomials.length) {
            currentDegree--;
            currentStep = 0;
        }

        observation.innerHTML = correctPrompt;
        observation.style.color = 'green';

        updateUI();

        if (currentDegree < 0) {
            displayFinalResults();
            return;
        }

    } else {
        if (observation.innerHTML === incorrectPrompt) {
            observation.innerHTML = repeatPrompt;
            observation.style.color = 'red';
        }
        else {
            observation.innerHTML = incorrectPrompt;
            observation.style.color = 'red';
        }

        updateUI();

        return;
    }

}

// Modified updateUI function with null checks
function updateUI() {
    const monomials = generateMonomials(currentDegree, numVariables);
    currentMonomial = monomials[currentStep];

    // Add null checks before updating DOM
    const receivedVectorEl = document.getElementById('receivedVector');
    const currentVectorEl = document.getElementById('currentVector');
    const currentDegreeEl = document.getElementById('currentDegree');
    const currentMonomialEl = document.getElementById('currentMonomial');
    const decodedPolynomialEl = document.getElementById('decodedPolynomial');
    const rmParaEl = document.getElementById('rmPara');

    rmParaEl.innerHTML = `\\( RM(${maxDegree}, ${numVariables}) \\)`;

    if (receivedVectorEl) receivedVectorEl.innerHTML = ` \\( \\mathbf{r} = (${receivedVector.join(',')})\\)`;
    if (currentVector) currentVectorEl.innerHTML = `\\(\\mathbf{y'} = (${currentVector.join(',')}) \\)`;
    if (currentDegreeEl) currentDegreeEl.innerHTML = `Current Degree: ${currentDegree}`;
    if (currentMonomialEl) currentMonomialEl.innerHTML = formatMonomial(currentMonomial);
    if (decodedPolynomialEl) decodedPolynomialEl.innerHTML = formatDecodedPolynomial();

    // Show subcodeword sums for current monomial
    // displaySubcodewordSums(currentMonomial);

    // Ensure MathJax only typesets if updates have occurred
    if (window.MathJax) {
        MathJax.typesetPromise()
            .then(() => {
                console.log('MathJax typeset completed successfully');
            })
            .catch((err) => {
                console.log('MathJax encountered an error during typesetting:', err);
            });
    } else {
        console.log('MathJax is not loaded');
    }
}

// Display final results
function displayFinalResults() {
    const finalResultEl = document.getElementById('finalResult');
    if (finalResultEl) {
        finalResultEl.innerHTML = `
            <h3>Decoding Complete!</h3>
            <p style="color:red;">Final decoded polynomial: ${formatDecodedPolynomial()}</p>
        `;
    }

    if (window.MathJax) {
        MathJax.typeset();
    }
}


// function getSubcodeIndices(monomial) {
//     const subcodeIndices = [];

//     // For a single variable monomial X_i, we need to partition based on all other variables
//     // For X4, we should fix variables {1,2,3} in all possible combinations
//     // const fixedVariables = Array.from({ length: numVariables }, (_, i) => i + 1)
//     //     .filter(x => !monomial.includes(x));

//     const fixedVariables = monomial;

//     // For X4, with 4 variables total, we should get 2^3 = 8 cosets
//     // Because we're fixing 3 variables (1,2,3) in all possible combinations
//     const numCosets = 2 ** fixedVariables.length;

//     // Generate binary patterns for fixed variables
//     for (let i = 0; i < numCosets; i++) {
//         let fixedPattern = i.toString(2).padStart(fixedVariables.length, '0').split('').map(Number);
//         let subvector = [];

//         // Go through all possible input vectors (16 for 4 variables)
//         for (let inputIdx = 0; inputIdx < 2 ** numVariables; inputIdx++) {
//             let inputVector = inputIdx.toString(2).padStart(numVariables, '0').split('').map(Number);

//             // Check if this input matches our fixed pattern for variables 1,2,3
//             let matches = true;
//             for (let j = 0; j < fixedVariables.length; j++) {
//                 if (inputVector[fixedVariables[j] - 1] !== fixedPattern[j]) {
//                     matches = false;
//                     break;
//                 }
//             }

//             if (matches) {
//                 subvector.push(inputIdx);
//             }
//         }

//         subcodeIndices.push(subvector);
//     }

//     return subcodeIndices;
// }

function getSubcodeIndices(monomial) {
    const subcodeIndices = [];
    
    // FIX: We must fix the variables NOT in the monomial (the complement set).
    // We sum over the variables IN the monomial.
    const allVarIndices = Array.from({ length: numVariables }, (_, i) => i + 1);
    const fixedVariables = allVarIndices.filter(v => !monomial.includes(v));

    // Calculate number of voting sets (cosets) based on COMPLEMENT variables
    const numCosets = 2 ** fixedVariables.length;

    // Generate patterns for the fixed variables (The Complement Variables)
    for (let i = 0; i < numCosets; i++) {
        let fixedPattern = [];
        for (let bit = 0; bit < fixedVariables.length; bit++) {
             fixedPattern.push((i >> bit) & 1);
        }

        let subvector = [];

        // Go through all possible input vectors
        for (let inputIdx = 0; inputIdx < 2 ** numVariables; inputIdx++) {
            let inputVector = [];
            for (let v = 0; v < numVariables; v++) {
                inputVector.push((inputIdx >> v) & 1);
            }

            // Check if this input matches our fixed pattern for the COMPLEMENT variables
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