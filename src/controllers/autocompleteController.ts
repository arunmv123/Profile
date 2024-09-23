import { Request, Response } from "express";

// Sample data for autocomplete
const degrees = ["B.Sc.", "M.Sc.", "Ph.D.", "B.A.", "M.A.", "MBA"];
const institutions = ["Harvard", "MIT", "Stanford", "Oxford", "Cambridge"];
const companies = ["Google", "Microsoft", "Amazon", "Facebook", "Tesla"];
const skills = ["JavaScript", "Python", "Node.js", "React", "TypeScript"];

// Autocomplete for degrees
const autocompleteDegree = (req: Request, res: Response) => {
  const searchTerm = req.query.q?.toString().toLowerCase();
  const filtered = degrees.filter((degree) =>
    degree.toLowerCase().includes(searchTerm || "")
  );
  return res.json(filtered);
};

// Autocomplete for institutions
const autocompleteInstitution = (req: Request, res: Response) => {
  const searchTerm = req.query.q?.toString().toLowerCase();
  const filtered = institutions.filter((institution) =>
    institution.toLowerCase().includes(searchTerm || "")
  );
  return res.json(filtered);
};

// Autocomplete for companies
const autocompleteCompany = (req: Request, res: Response) => {
  const searchTerm = req.query.q?.toString().toLowerCase();
  const filtered = companies.filter((company) =>
    company.toLowerCase().includes(searchTerm || "")
  );
  return res.json(filtered);
};

// Autocomplete for skills
const autocompleteSkill = (req: Request, res: Response) => {
  const searchTerm = req.query.q?.toString().toLowerCase();
  const filtered = skills.filter((skill) =>
    skill.toLowerCase().includes(searchTerm || "")
  );
  return res.json(filtered);
};

export {
  autocompleteDegree,
  autocompleteInstitution,
  autocompleteCompany,
  autocompleteSkill,
};
