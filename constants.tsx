
import React from 'react';
import { ControlLevel } from './types';

export const FLOORS = [
  { 
    level: ControlLevel.ELIMINATION, 
    name: 'Elimination', 
    emoji: '🚫', 
    desc: 'Remove the hazard completely.',
    color: 'bg-red-600'
  },
  { 
    level: ControlLevel.SUBSTITUTION, 
    name: 'Substitution', 
    emoji: '🔄', 
    desc: 'Swap for a safer alternative.',
    color: 'bg-orange-500'
  },
  { 
    level: ControlLevel.ENGINEERING, 
    name: 'Engineering Controls', 
    emoji: '⚙️', 
    desc: 'Isolate the hazard (guards, barriers).',
    color: 'bg-yellow-500'
  },
  { 
    level: ControlLevel.ADMINISTRATIVE, 
    name: 'Administrative Controls', 
    emoji: '📋', 
    desc: 'Change how people work (signs, training).',
    color: 'bg-blue-500'
  },
  { 
    level: ControlLevel.PPE, 
    name: 'PPE', 
    emoji: '🦺', 
    desc: 'Protect the person, not the place.',
    color: 'bg-green-600'
  },
];

export const NEBOSH_DEFINITIONS = [
  {
    term: "Reasonably Practicable",
    definition: "Balancing the degree of risk against the time, trouble, cost and physical difficulty of taking measures to avoid the risk. If the cost (in all its forms) is grossly disproportionate to the benefit, it may not be 'reasonably practicable'."
  },
  {
    term: "Hierarchy of Controls",
    definition: "A system used in industry to minimize or eliminate exposure to hazards. It is a widely accepted system promoted by numerous safety organizations including NEBOSH."
  },
  {
    term: "Hazard",
    definition: "Anything with the potential to cause harm."
  },
  {
    term: "Risk",
    definition: "The likelihood that a hazard will cause harm in combination with the severity of that harm."
  },
  {
    level: 5,
    term: "Elimination",
    definition: "The most effective control. It involves physically removing the hazard. For example, stopping the use of a dangerous chemical."
  },
  {
    level: 4,
    term: "Substitution",
    definition: "Replacing the hazard with a non-hazardous or less-hazardous substitute. For example, using water-based paint instead of solvent-based."
  },
  {
    level: 3,
    term: "Engineering Controls",
    definition: "Using physical measures to isolate people from the hazard. For example, fitting guards to a machine or using local exhaust ventilation (LEV)."
  },
  {
    level: 2,
    term: "Administrative Controls",
    definition: "Changing the way people work through procedures, training, or signage. For example, implementing a 'Permit to Work' system."
  },
  {
    level: 1,
    term: "PPE",
    definition: "The final barrier and last resort. It only protects the individual wearing it. If it fails, the individual is immediately exposed to the hazard."
  }
];
