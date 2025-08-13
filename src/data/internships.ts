import { JobItem } from "@/components/jobs/JobCard";

export const internships: JobItem[] = [
  {
    id: "i1",
    title: "Software Engineering Intern",
    company: "Orbit Labs",
    location: "Remote",
    type: "Internship",
    remote: true,
    url: "https://example.com/internships/se-intern",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "i2",
    title: "Data Science Intern",
    company: "Nova AI",
    location: "New York, NY",
    type: "Internship",
    remote: false,
    url: "https://example.com/internships/ds-intern",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "i3",
    title: "Design Intern",
    company: "BrightPixel",
    location: "Remote - Americas",
    type: "Internship",
    remote: true,
    url: "https://example.com/internships/design-intern",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: "i4",
    title: "Growth Intern",
    company: "Nimbus Cloud",
    location: "Berlin, DE",
    type: "Internship",
    remote: false,
    url: "https://example.com/internships/growth-intern",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];
