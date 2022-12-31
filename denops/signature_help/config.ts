export type signatureStyle =
  | "labelOnly"
  | "currentLabelOnly"
  | "full"
  | "virtual";

export type contentsStyle =
  | "full"
  | "labels"
  | "currentLabel"
  | "remainingLabels";

export type viewStyle =
  | "virtual"
  | "floating"
  | "ghost";

export type Config = {
  border: boolean;
  maxWidth: number;
  maxHeight: number;
  winblend?: number;
  delay: number; // not implemented yet
  contentsStyle: contentsStyle;
  viewStyle: viewStyle;
  onTriggerChar: boolean;
  multiLabel: boolean;
  fallbackToBelow: boolean;
};

export function getDefaultDocConfig(): Config {
  return {
    border: true,
    maxWidth: 80,
    maxHeight: 30,
    delay: 50,
    contentsStyle: "full",
    viewStyle: "floating",
    onTriggerChar: false,
    multiLabel: false,
    fallbackToBelow: true,
  };
}

export type UserConfig = Config & {
  style?: signatureStyle;
};

export function makeConfig(userConfig: UserConfig): Config {
  const config: Config = getDefaultDocConfig();
  const style = userConfig.style;
  if (style == "labelOnly") {
    userConfig.contentsStyle = "labels";
    userConfig.viewStyle = "floating";
  } else if (style == "currentLabelOnly") {
    userConfig.contentsStyle = "currentLabel";
    userConfig.viewStyle = "floating";
  } else if (style == "full") {
    userConfig.contentsStyle = "full";
    userConfig.viewStyle = "floating";
  } else if (style == "virtual") {
    userConfig.contentsStyle = "remainingLabels";
    userConfig.viewStyle = "virtual";
  }
  if (userConfig) {
    Object.assign(config, userConfig);
  }
  return config;
}
