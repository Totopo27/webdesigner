export interface Screen1789423065388ViewItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface Screen1789423065388ViewProps {
  readonly title?: string;
  readonly items?: ReadonlyArray<Screen1789423065388ViewItem>;
  readonly className?: string;
}
