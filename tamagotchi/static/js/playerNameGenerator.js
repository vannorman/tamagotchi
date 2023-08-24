PlayerNameGenerator = {

    adjectives :["Algebraic", "Calculus", "Eulerian", "Fibonacci", "Geometric", "Harmonic", "Infinite", "Jacobian", "Knot", "Logarithmic"],
    nouns : ["Axiom", "Bracket", "Conic", "Derivative", "Equation", "Fractal", "Gradient", "Hypothesis", "Integer", "Joule"],

    getRandomElement(array) {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    },
    
    getRandomName(){
        const array = this.androgynousNames.length > 0 ? this.androgynousNames : this.createNames();
        return this.getRandomElement(array);
    },

    generateAndrogynousName() {
        const adjective = this.getRandomElement(this.adjectives);
        const noun = this.getRandomElement(this.nouns);
        return adjective + noun;
    },

    androgynousNames : [],
    createNames(){
        for (let i = 0; i < 32; i++) {
            this.androgynousNames.push(this.generateAndrogynousName());
        }
        return this.androgynousNames;
    }


}

