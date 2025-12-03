import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.overrideWebpackConfig(enableTailwind);

Config.setChromiumDisableWebSecurity(true);
Config.setChromiumIgnoreCertificateErrors(true);

Config.setCodec("vp9");
Config.setPixelFormat("yuva420p");
Config.setVideoImageFormat("png");
Config.setAudioCodec("opus");
Config.setHardwareAcceleration("if-possible");
