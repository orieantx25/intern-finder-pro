import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

export interface FilterState {
  q: string;
  type: "All" | "Full-time" | "Part-time" | "Contract" | "Internship";
  remoteOnly: boolean;
}

interface JobsFilterBarProps {
  onChange: (state: FilterState) => void;
}

const JobsFilterBar = ({ onChange }: JobsFilterBarProps) => {
  const [state, setState] = useState<FilterState>({ q: "", type: "All", remoteOnly: false });

  useEffect(() => onChange(state), [state, onChange]);

  const reset = () => setState({ q: "", type: "All", remoteOnly: false });

  const selectValue = useMemo(() => state.type, [state.type]);

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Input
        value={state.q}
        onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
        placeholder="Search by role, company, or location"
        aria-label="Search jobs"
      />
      <Select value={selectValue} onValueChange={(v: FilterState["type"]) => setState((s) => ({ ...s, type: v }))}>
        <SelectTrigger className="min-w-40">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All types</SelectItem>
          <SelectItem value="Full-time">Full-time</SelectItem>
          <SelectItem value="Part-time">Part-time</SelectItem>
          <SelectItem value="Contract">Contract</SelectItem>
          <SelectItem value="Internship">Internship</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant={state.remoteOnly ? "default" : "outline"}
        onClick={() => setState((s) => ({ ...s, remoteOnly: !s.remoteOnly }))}
        aria-pressed={state.remoteOnly}
      >
        {state.remoteOnly ? "Remote only ✓" : "Remote only"}
      </Button>
      <Button variant="ghost" onClick={reset} aria-label="Reset filters">
        Reset
      </Button>
    </div>
  );
};

export default JobsFilterBar;
