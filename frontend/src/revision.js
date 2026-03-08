import React, { useState } from "react";
import "./revision.css";

const sampleFlashcards = [
  { question: "What is the Nernst Equation?", answer: "E = E° - (RT/nF) ln Q, where E is the cell potential, E° is the standard cell potential, R is the gas constant, T is temperature, n is the number of electrons transferred, F is Faraday's constant, and Q is the reaction quotient.", topic: "Electrochemistry" },
  { question: "What is Faraday's First Law of Electrolysis?", answer: "The mass of a substance deposited at an electrode during electrolysis is directly proportional to the quantity of electricity passed through the electrolyte.", topic: "Electrochemistry" },
  { question: "Define standard electrode potential.", answer: "The potential difference developed between the metal electrode and the standard hydrogen electrode when the concentration of the metal ion solution is 1 M, temperature is 298 K, and pressure is 1 atm.", topic: "Electrochemistry" },
  { question: "What is an electrochemical cell?", answer: "A device that converts chemical energy into electrical energy through spontaneous redox reactions. It consists of two half-cells connected by a salt bridge.", topic: "Electrochemistry" },
  { question: "What is the role of a salt bridge?", answer: "A salt bridge maintains electrical neutrality in the two half-cells by allowing the flow of ions, thereby completing the electrical circuit.", topic: "Electrochemistry" },
  { question: "Define molar conductivity.", answer: "Molar conductivity is the conductivity of a solution divided by the molar concentration of the electrolyte. It is denoted by Λm and its unit is S cm² mol⁻¹.", topic: "Electrochemistry" },
  { question: "State Kohlrausch's Law.", answer: "The limiting molar conductivity of an electrolyte is the sum of the individual contributions of the cation and anion of the electrolyte: Λ°m = ν+ λ°+ + ν− λ°−.", topic: "Electrochemistry" },
  { question: "What is EMF of a cell?", answer: "Electromotive force (EMF) is the potential difference between the two electrodes of a galvanic cell when no current flows through the circuit. It is measured in volts.", topic: "Electrochemistry" },
  { question: "Define Gibbs energy change for a cell reaction.", answer: "ΔG = −nFE_cell, where n is the number of moles of electrons exchanged, F is Faraday's constant, and E_cell is the EMF of the cell.", topic: "Electrochemistry" },
  { question: "What is a fuel cell?", answer: "A fuel cell is a galvanic cell that converts the chemical energy of a fuel (like hydrogen) directly into electrical energy. The reactants are continuously supplied from an external source.", topic: "Electrochemistry" },
  { question: "What is corrosion?", answer: "Corrosion is the process of deterioration of metals due to electrochemical reactions with the environment, forming oxides, hydroxides, or sulfides on the surface.", topic: "Electrochemistry" },
  { question: "Define electrolysis.", answer: "Electrolysis is the process of using electrical energy to drive a non-spontaneous chemical reaction. It involves passing electric current through an electrolyte.", topic: "Electrochemistry" },
  { question: "What is the Nernst Equation for a single electrode?", answer: "E = E° - (RT/nF) ln [M^n+], which at 298 K simplifies to E = E° - (0.0591/n) log [M^n+].", topic: "Electrochemistry" },
  { question: "What is an electrolytic cell?", answer: "An electrolytic cell is a device that uses electrical energy to carry out non-spontaneous chemical reactions. The anode is positive and cathode is negative.", topic: "Electrochemistry" },
  { question: "Define conductivity of a solution.", answer: "Conductivity (κ) is the reciprocal of resistivity. It measures the ability of a solution to conduct electric current, with unit S cm⁻¹.", topic: "Electrochemistry" },
  { question: "What is Faraday's Second Law?", answer: "When the same quantity of electricity is passed through different electrolytes, the masses of substances deposited are proportional to their equivalent weights.", topic: "Electrochemistry" },
  { question: "What is the standard hydrogen electrode?", answer: "SHE is a reference electrode with an assigned potential of 0.00 V. It consists of a platinum electrode in contact with 1 M H⁺ solution and H₂ gas at 1 atm.", topic: "Electrochemistry" },
  { question: "Define cell constant.", answer: "Cell constant is the ratio of the distance between the electrodes (l) to the area of cross-section (A) of the electrode. It is given by l/A with unit cm⁻¹.", topic: "Electrochemistry" },
  { question: "What is the electrochemical series?", answer: "The arrangement of elements in order of their standard electrode potentials, from the most negative to the most positive. It helps predict the feasibility of redox reactions.", topic: "Electrochemistry" },
  { question: "Define overpotential.", answer: "Overpotential is the extra potential (beyond the theoretical value) needed to drive an electrochemical reaction at a certain rate. It arises due to kinetic barriers at the electrode surface.", topic: "Electrochemistry" },
];

function Revision() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [markedForRevision, setMarkedForRevision] = useState(new Set());

  const total = sampleFlashcards.length;
  const card = sampleFlashcards[currentIndex];
  const progressPercent = ((currentIndex + 1) / total) * 100;

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const toggleMark = () => {
    setMarkedForRevision((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  return (
    <div className="revision-container">
      {/* Progress bar area */}
      <div className="revision-progress-bar-area">
        <div className="revision-progress-info">
          <span className="revision-progress-text">Progress: {currentIndex + 1}/{total}</span>
          <span className="revision-topic-text">Topic: {card.topic}</span>
        </div>
        <div className="revision-progress-track">
          <div className="revision-progress-fill" style={{ width: `${progressPercent}%` }} />
          <div className="revision-progress-thumb" style={{ left: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div className="revision-flashcard-wrapper">
        <div className="revision-flashcard-badge">Flashcard {currentIndex + 1}/{total}</div>
        <div className={`revision-flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
          <div className="revision-flashcard-inner">
            <div className="revision-flashcard-front">
              <div className="revision-flashcard-label">Question</div>
              <div className="revision-flashcard-question">{card.question}</div>
              <div className="revision-flashcard-hint">(Try to recall before flipping)</div>
              <div className="revision-flashcard-divider" />
              <button className="revision-flip-btn" onClick={e => { e.stopPropagation(); setFlipped(true); }}>Flip Card</button>
            </div>
            <div className="revision-flashcard-back">
              <div className="revision-flashcard-label">Answer</div>
              <div className="revision-flashcard-answer">{card.answer}</div>
              <div className="revision-flashcard-divider" />
              <button className="revision-flip-btn" onClick={e => { e.stopPropagation(); setFlipped(false); }}>Flip Back</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="revision-controls">
        <button className="revision-ctrl-btn" onClick={goPrev} disabled={currentIndex === 0}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#1D1B20"/>
          </svg>
          Prev
        </button>
        <button
          className={`revision-ctrl-btn revision-mark-btn ${markedForRevision.has(currentIndex) ? "marked" : ""}`}
          onClick={toggleMark}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3ZM17 18L12 15.82L7 18V5H17V18Z" fill={markedForRevision.has(currentIndex) ? "#6750A4" : "black"}/>
          </svg>
          {markedForRevision.has(currentIndex) ? "Marked" : "Mark for revision"}
        </button>
        <button className="revision-ctrl-btn" onClick={goNext} disabled={currentIndex === total - 1}>
          Next
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 13H16.17L10.58 18.59L12 20L20 12L12 4L10.59 5.41L16.17 11H4V13Z" fill="#1D1B20"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Revision;
