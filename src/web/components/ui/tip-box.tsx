import { Card, CardTitle } from '@/components/ui/card';

interface TipBoxProps {
  title?: string;
  children: React.ReactNode;
}

function TipBox({ title = '// tips & shortcuts', children }: TipBoxProps): React.JSX.Element {
  return (
    <Card className="bg-transparent">
      <CardTitle className="select-none text-[11px] text-text-muted">{title}</CardTitle>
      <div className="flex flex-col gap-2">{children}</div>
    </Card>
  );
}

export default TipBox;
