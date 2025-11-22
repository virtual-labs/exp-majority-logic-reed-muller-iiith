
## Majority Logic Decoding of RM Codes

A key advantage of Reed-Muller codes is their amenability to an efficient, iterative decoding method known as majority logic decoding. This procedure systematically recovers the coefficients of the original message polynomial, starting from the highest degree and working downwards. For an $RM(r, m)$ code, this algorithm can correct up to $t = \lfloor (d_{min}-1)/2 \rfloor$ errors, where the minimum distance $d_{min}$ is $2^{m-r}$.

Throughout this section, we will use the $RM(2, 4)$ code as our running example.

*   **Parameters:** $m=4, r=2$.
*   **Minimum Distance:** $d_{min} = 2^{4-2} = 4$.
*   **Error Correction Capability:** $t = \lfloor (4-1)/2 \rfloor = 1$. The decoder can reliably correct any single-bit error in the received vector.

### 1. Finding High-Degree Coefficients in a Noiseless Codeword

The decoding process begins by isolating the coefficients of the monomials with the highest degree, $r$. In a noiseless setting, this can be done with a simple summation. The key idea is to sum specific bits of the codeword in a way that cancels out the influence of all lower-degree monomials.

First, let's define the tools we need:

*   **Monomial Index Set ($S$):** For a monomial $M = \prod_{i \in S} X_i$, the set $S$ contains the indices of the variables present in that monomial. For the monomial $M = X_1X_2$, the index set is $S=\{1,2\}$. The set of uninvolved variable indices is its complement, $S^c=\{3,4\}$.

*   **Check Set ($\mathcal{V}_S(\mathbf{b})$):** A check set for the coefficient $a_S$ is a collection of codeword coordinates. It is defined by fixing the values of the uninvolved variables (those with indices in $S^c$) to a constant binary vector $\mathbf{b}$.
    $$ \mathcal{V}_S(\mathbf{b}) = \{ \mathbf{v} \in \mathbb{F}_2^m \mid \text{the components of } \mathbf{v} \text{ corresponding to indices in } S^c \text{ are equal to } \mathbf{b} \} $$

When we sum the evaluations of a polynomial $f(\mathbf{X})$ over a check set, a fundamental property of Boolean algebra ensures that any monomial with degree less than the size of the set (here, degree $< r$) will evaluate to one an even number of times. Thus, its sum is zero in $\mathbb{F}_2$. The only term that may have a non-zero sum is the highest-degree monomial matching the variables of the check set. This allows us to isolate its coefficient.

#### Example: Finding $a_{12}$ in a Noiseless $RM(2,4)$ Codeword

Let the message polynomial be $f(\mathbf{X}) = X_1X_2 + X_3$. Its noiseless codeword is:
$\mathbf{C} = (0,0,1,1, \ 0,0,1,1, \ 0,0,1,1, \ 1,1,0,0)$

To find the coefficient $a_{12}$, we can use any check set for this monomial. Let's choose the one where the uninvolved variables $(X_3, X_4)$ are fixed to $\mathbf{b}=(0,0)$. The check set is $\mathcal{V}_{12}(0,0) = \{(0000), (0100), (1000), (1100)\}$. The check sum is:
$$ \text{Sum} = C_{(0000)} + C_{(0100)} + C_{(1000)} + C_{(1100)} = 0 + 0 + 0 + 1 = 1 $$
This sum directly gives us the coefficient: $a_{12}=1$.

---

### 2. Decoding High-Degree Coefficients from a Noisy Codeword

When the received vector $\mathbf{Y}$ contains errors, a single check sum can be misleading. Majority logic overcomes this by using multiple, disjoint check sets to vote on the correct coefficient value. For a monomial of degree $r$, we can generate $2^{m-r}$ disjoint check sets. For an $RM(r,m)$ code with minimum distance $d_{min}=2^{m-r}$, if the number of errors is at most $t = (d_{min}-1)/2$, a majority of the check sums will still yield the correct value.

---

### 3. The General Iterative Decoding Algorithm

The full decoding algorithm is an iterative process that decodes coefficients in stages, from the highest degree $r$ down to 0. It uses a "decode and peel" strategy.

**Input:** A received vector $\mathbf{Y}$ of length $n = 2^m$.
**Output:** The decoded message polynomial $\hat{f}(\mathbf{X})$.

**Initialization:**
1.  Set the current degree to decode: $i = r$.
2.  Initialize the working vector: $\mathbf{Y}_r = \mathbf{Y}$.
3.  Initialize the final decoded polynomial: $\hat{f}(\mathbf{X}) = 0$.

**Iterative Loop (from $i=r$ down to $0$):**

1.  **Decode Coefficients of Degree $i$:**
    *   For each of the $\binom{m}{i}$ monomials $M_S$ of degree $i$:
        a. Generate all $2^{m-i}$ disjoint check sets $\mathcal{V}_S(\mathbf{b})$ by letting $\mathbf{b}$ range over all vectors in $\mathbb{F}_2^{m-i}$.
        b. For each check set, compute a check sum (an estimate) by summing the values of the current working vector $\mathbf{Y}_i$ over the coordinates in that set.
        c. Determine the coefficient $\hat{a}_S$ by taking the majority vote of the $2^{m-i}$ estimates.

2.  **Form Degree-$i$ Polynomial:**
    *   Construct the polynomial containing all the just-decoded terms of degree $i$:
        $$ \hat{f}_i(\mathbf{X}) = \sum_{|S|=i} \hat{a}_S M_S $$

3.  **Update Final Polynomial:**
    *   Add this part to the overall result: $\hat{f}(\mathbf{X}) = \hat{f}(\mathbf{X}) + \hat{f}_i(\mathbf{X})$.

4.  **"Peel Off" and Prepare for Next Stage:**
    *   Generate the codeword for the degree-$i$ polynomial: $\mathbf{C}_i = \text{Eval}(\hat{f}_i)$.
    *   Create the working vector for the next lower degree by subtracting this contribution (using XOR):
        $$ \mathbf{Y}_{i-1} = \mathbf{Y}_i + \mathbf{C}_i $$

5.  **Decrement:**
    *   Set $i = i - 1$ and repeat the loop until all degrees down to 0 have been processed.

---

### A Detailed Example: Full Decoding of an RM(2,4) Vector

Let's apply the general algorithm to our example. Suppose a single error flips the first bit of the codeword for $f(\mathbf{X}) = X_1X_2 + X_3$. The received vector is:
$\mathbf{Y} = (\textbf{1},0,1,1, \ 0,0,1,1, \ 0,0,1,1, \ 1,1,0,0)$

#### **Stage 1: Decode Degree 2 (i=2)**
We begin with the working vector $\mathbf{Y}_2 = \mathbf{Y}$. We decode all $\binom{4}{2}=6$ degree-2 coefficients.

*   **For $\hat{a}_{12}$ (fix $X_3,X_4$):**
    *   $v_3,v_4=0,0$: $Y_{(0000)}+Y_{(0100)}+Y_{(1000)}+Y_{(1100)} = 1+0+0+1=0$.
    *   $v_3,v_4=0,1$: $Y_{(0001)}+Y_{(0101)}+Y_{(1001)}+Y_{(1101)} = 0+0+0+1=1$.
    *   $v_3,v_4=1,0$: $Y_{(0010)}+Y_{(0110)}+Y_{(1010)}+Y_{(1110)} = 1+1+1+0=1$.
    *   $v_3,v_4=1,1$: $Y_{(0011)}+Y_{(0111)}+Y_{(1011)}+Y_{(1111)} = 1+1+1+0=1$.
    *   Estimates: $(0,1,1,1) \implies$ Majority: **1**.
*   **For $\hat{a}_{13}$ (fix $X_2,X_4$):**
    *   $v_2,v_4 = 0,0$: $Y_{(0000)}+Y_{(0010)}+Y_{(1000)}+Y_{(1010)} = 1+1+0+1=1$.
    *   $v_2,v_4 = 0,1$: $Y_{(0001)}+Y_{(0011)}+Y_{(1001)}+Y_{(1011)} = 0+1+0+1=0$.
    *   $v_2,v_4 = 1,0$: $Y_{(0100)}+Y_{(0110)}+Y_{(1100)}+Y_{(1110)} = 0+1+1+0=0$.
    *   $v_2,v_4 = 1,1$: $Y_{(0101)}+Y_{(0111)}+Y_{(1101)}+Y_{(1111)} = 0+1+1+0=0$.
    *   Estimates: $(1,0,0,0) \implies$ Majority: **0**.
*   **For $\hat{a}_{14}$ (fix $X_2,X_3$):**
    *   $v_2,v_3 = 0,0$: $Y_{(0000)}+Y_{(0001)}+Y_{(1000)}+Y_{(1001)} = 1+0+0+0=1$.
    *   $v_2,v_3 = 0,1$: $Y_{(0010)}+Y_{(0011)}+Y_{(1010)}+Y_{(1011)} = 1+1+1+1=0$.
    *   $v_2,v_3 = 1,0$: $Y_{(0100)}+Y_{(0101)}+Y_{(1100)}+Y_{(1101)} = 0+0+1+1=0$.
    *   $v_2,v_3 = 1,1$: $Y_{(0110)}+Y_{(0111)}+Y_{(1110)}+Y_{(1111)} = 1+1+0+0=0$.
    *   Estimates: $(1,0,0,0) \implies$ Majority: **0**.
*   **For $\hat{a}_{23}$ (fix $X_1,X_4$):**
    *   $v_1,v_4 = 0,0$: $Y_{(0000)}+Y_{(0010)}+Y_{(0100)}+Y_{(0110)} = 1+1+0+1=1$.
    *   $v_1,v_4 = 0,1$: $Y_{(0001)}+Y_{(0011)}+Y_{(0101)}+Y_{(0111)} = 0+1+0+1=0$.
    *   $v_1,v_4 = 1,0$: $Y_{(1000)}+Y_{(1010)}+Y_{(1100)}+Y_{(1110)} = 0+1+1+0=0$.
    *   $v_1,v_4 = 1,1$: $Y_{(1001)}+Y_{(1011)}+Y_{(1101)}+Y_{(1111)} = 0+1+1+0=0$.
    *   Estimates: $(1,0,0,0) \implies$ Majority: **0**.
*   **For $\hat{a}_{24}$ (fix $X_1,X_3$):**
    *   $v_1,v_3 = 0,0$: $Y_{(0000)}+Y_{(0001)}+Y_{(0100)}+Y_{(0101)} = 1+0+0+0=1$.
    *   $v_1,v_3 = 0,1$: $Y_{(0010)}+Y_{(0011)}+Y_{(0110)}+Y_{(0111)} = 1+1+1+1=0$.
    *   $v_1,v_3 = 1,0$: $Y_{(1000)}+Y_{(1001)}+Y_{(1100)}+Y_{(1101)} = 0+0+1+1=0$.
    *   $v_1,v_3 = 1,1$: $Y_{(1010)}+Y_{(1011)}+Y_{(1110)}+Y_{(1111)} = 1+1+0+0=0$.
    *   Estimates: $(1,0,0,0) \implies$ Majority: **0**.
*   **For $\hat{a}_{34}$ (fix $X_1,X_2$):**
    *   $v_1,v_2 = 0,0$: $Y_{(0000)}+Y_{(0001)}+Y_{(0010)}+Y_{(0011)} = 1+0+1+1=1$.
    *   $v_1,v_2 = 0,1$: $Y_{(0100)}+Y_{(0101)}+Y_{(0110)}+Y_{(0111)} = 0+0+1+1=0$.
    *   $v_1,v_2 = 1,0$: $Y_{(1000)}+Y_{(1001)}+Y_{(1010)}+Y_{(1011)} = 0+0+1+1=0$.
    *   $v_1,v_2 = 1,1$: $Y_{(1100)}+Y_{(1101)}+Y_{(1110)}+Y_{(1111)} = 1+1+0+0=0$.
    *   Estimates: $(1,0,0,0) \implies$ Majority: **0**.

**Degree-2 Conclusion:** The decoded degree-2 polynomial is $\hat{f}_2(\mathbf{X}) = X_1X_2$. Now we peel it off.
*   Generate its codeword: $\mathbf{C}_2 = \text{Eval}(X_1X_2) = (0,0,0,0, \ 0,0,0,0, \ 0,0,0,0, \ 1,1,1,1)$.
*   Update our working vector for the next stage: $\mathbf{Y}_1 = \mathbf{Y}_2 + \mathbf{C}_2 = (1,0,1,1, \ 0,0,1,1, \ 0,0,1,1, \ 0,0,1,1)$.

#### **Stage 2: Decode Degree 1 (i=1)**
We now use $\mathbf{Y}_1$ to decode degree-1 coefficients. We are targeting an $RM(1,4)$ code ($d_{min}=8$), so we get 8 estimates for each coefficient.

*   **For $\hat{a}_1$ (fix $X_2,X_3,X_4$):**
    *   $v_2,v_3,v_4 = 0,0,0$: $Y'_1{(0000)}+Y'_1{(1000)} = 1+0=1$.
    *   $v_2,v_3,v_4 = 0,0,1$: $Y'_1{(0001)}+Y'_1{(1001)} = 0+0=0$.
    *   $v_2,v_3,v_4 = 0,1,0$: $Y'_1{(0010)}+Y'_1{(1010)} = 1+1=0$.
    *   $v_2,v_3,v_4 = 0,1,1$: $Y'_1{(0011)}+Y'_1{(1011)} = 1+1=0$.
    *   $v_2,v_3,v_4 = 1,0,0$: $Y'_1{(0100)}+Y'_1{(1100)} = 0+0=0$.
    *   $v_2,v_3,v_4 = 1,0,1$: $Y'_1{(0101)}+Y'_1{(1101)} = 0+0=0$.
    *   $v_2,v_3,v_4 = 1,1,0$: $Y'_1{(0110)}+Y'_1{(1110)} = 1+1=0$.
    *   $v_2,v_3,v_4 = 1,1,1$: $Y'_1{(0111)}+Y'_1{(1111)} = 1+1=0$.
    *   Estimates: $(1,0,0,0,0,0,0,0) \implies$ Majority: **0**.
*   **For $\hat{a}_2$ (fix $X_1,X_3,X_4$):**
    *   $v_1,v_3,v_4 = 0,0,0$: $Y'_1{(0000)}+Y'_1{(0100)} = 1+0=1$.
    *   The other 7 sums will be 0.
    *   Estimates: $(1,0,0,0,0,0,0,0) \implies$ Majority: **0**.
*   **For $\hat{a}_3$ (fix $X_1,X_2,X_4$):**
    *   $v_1,v_2,v_4 = 0,0,0$: $Y'_1{(0000)}+Y'_1{(0010)} = 1+1=0$.
    *   The other 7 sums will be 1.
    *   Estimates: $(0,1,1,1,1,1,1,1) \implies$ Majority: **1**.
*   **For $\hat{a}_4$ (fix $X_1,X_2,X_3$):**
    *   $v_1,v_2,v_3 = 0,0,0$: $Y'_1{(0000)}+Y'_1{(0001)} = 1+0=1$.
    *   The other 7 sums will be 0.
    *   Estimates: $(1,0,0,0,0,0,0,0) \implies$ Majority: **0**.

**Degree-1 Conclusion:** The decoded degree-1 polynomial is $\hat{f}_1(\mathbf{X}) = X_3$. We peel it off.
*   Generate its codeword: $\mathbf{C}_1 = \text{Eval}(X_3) = (0,0,1,1, \ 0,0,1,1, \ 0,0,1,1, \ 0,0,1,1)$.
*   Update the vector for the final stage: $\mathbf{Y}_0 = \mathbf{Y}_1 + \mathbf{C}_1 = (1,0,0,0, \ 0,0,0,0, \ 0,0,0,0, \ 0,0,0,0)$.

#### **Stage 3: Decode Degree 0 (i=0)**
*   To find the constant term $a_0$, we take a majority vote of all 16 bits in $\mathbf{Y}_0$. There is one '1' and fifteen '0's.
*   The majority is **0**, so $\hat{a}_0=0$. The decoded degree-0 polynomial is $\hat{f}_0(\mathbf{X}) = 0$.

#### **Final Result:**
By summing the polynomials from each stage, we reconstruct the original message:
$$ \hat{f}(\mathbf{X}) = \hat{f}_2(\mathbf{X}) + \hat{f}_1(\mathbf{X}) + \hat{f}_0(\mathbf{X}) = X_1X_2 + X_3 + 0 = X_1X_2 + X_3 $$
