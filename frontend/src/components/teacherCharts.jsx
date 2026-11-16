export function BarChart({ courses }) {
  if (courses.length === 0) {
    return <p className="flex min-h-56 items-center justify-center text-center text-sm text-muted-foreground">Aucun cours enregistré.</p>;
  }

  const values = courses.map((course) => Number(course.enrolledStudentCount) || 0);
  const maxValue = Math.max(...values, 1);

  return (
    <div className="space-y-3" role="img" aria-label="Nombre d'étudiants associés par cours">
      <div className="flex h-56 items-end gap-2 border-b border-border px-2 pb-2 sm:gap-4">
        {courses.map((course, index) => {
          const value = values[index];
          const height = `${Math.max(value ? (value / maxValue) * 100 : 3, 3)}%`;
          return (
            <div key={course.id} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-semibold tabular-nums text-foreground">{value}</span>
              <div className="w-full max-w-12 rounded-t-md bg-primary transition-all duration-500 hover:bg-primary-deep" style={{ height }} title={`${course.name}: ${value} étudiant${value > 1 ? "s" : ""}`} />
            </div>
          );
        })}
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${courses.length}, minmax(0, 1fr))` }}>
        {courses.map((course) => <span key={course.id} className="truncate text-center text-xs text-muted-foreground" title={course.name}>{course.code || course.name}</span>)}
      </div>
    </div>
  );
}

export function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return <p className="flex min-h-56 items-center justify-center text-center text-sm text-muted-foreground">Aucune ressource enregistrée.</p>;
  }

  let accumulated = 0;
  const slices = data.filter((item) => item.value > 0).map((item) => {
    const start = accumulated;
    accumulated += item.value;
    return { ...item, start };
  });

  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-6 sm:flex-row sm:justify-start">
      <svg viewBox="0 0 42 42" className="size-44 shrink-0 -rotate-90" role="img" aria-label="Répartition des ressources">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--muted)" strokeWidth="8" />
        {slices.map((slice) => {
          const dash = (slice.value / total) * 100;
          const offset = -(slice.start / total) * 100;
          return <circle key={slice.label} cx="21" cy="21" r="15.9155" fill="none" stroke={slice.color} strokeWidth="8" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={offset} />;
        })}
      </svg>
      <div className="w-full space-y-3">
        {data.map((item) => <div key={item.label} className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong className="tabular-nums">{item.value} <span className="font-normal text-muted-foreground">({Math.round((item.value / total) * 100)}%)</span></strong></div>)}
      </div>
    </div>
  );
}
