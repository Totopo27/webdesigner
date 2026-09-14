export interface Screen1789421839297ViewItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface Screen1789421839297ViewProps {
  readonly title?: string;
  readonly items?: ReadonlyArray<Screen1789421839297ViewItem>;
  readonly className?: string;
}
