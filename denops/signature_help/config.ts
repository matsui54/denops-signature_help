export type signatureStyle =
  | "labelOnly"
  | "currentLabelOnly"
  | "full"
  | "virtual";

export type contentsStyle =
  | "labelOnly"
  | "currentLabelOnly"
  | "full"
  | "remaining";

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
  // style: signatureStyle;
  contentsStyle: contentsStyle;
  viewStyle: viewStyle;
  onTriggerChar: boolean;
  multiLabel: boolean;
};

export function getDefaultDocConfig(): Config {
  return {
    border: true,
    maxWidth: 80,
    maxHeight: 30,
    delay: 50,
    // style: "full",
    contentsStyle: "full",
    viewStyle: "floating",
    onTriggerChar: false,
    multiLabel: false,
  };
}

export type UserConfig = Config & {
  style?: signatureStyle;
};

export function makeConfig(userConfig: UserConfig): Config {
  const config: Config = getDefaultDocConfig();
  const style = userConfig.style;
  if (style == "labelOnly") {
    userConfig.contentsStyle = "labelOnly";
    userConfig.viewStyle = "floating";
  } else if (style == "currentLabelOnly") {
    userConfig.contentsStyle = "currentLabelOnly";
    userConfig.viewStyle = "floating";
  } else if (style == "full") {
    userConfig.contentsStyle = "full";
    userConfig.viewStyle = "floating";
  } else if (style == "virtual") {
    userConfig.contentsStyle = "remaining";
    userConfig.viewStyle = "virtual";
  }
  if (userConfig) {
    Object.assign(config, userConfig);
  }
  return config;
}
