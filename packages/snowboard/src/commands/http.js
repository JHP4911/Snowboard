import { Command, flags } from "@oclif/command";
import { httpPack } from "snowboard-packer";
import { parseBinding, detectTemplate, detectOutput } from "../helper";
import searchConfig from "../config";

class HttpCommand extends Command {
  static args = [{ name: "input", required: true }];

  async run() {
    const { flags, args } = this.parse(HttpCommand);
    const [host, port] = parseBinding(flags.bind);
    const { html: htmlConfig } = await searchConfig();

    return await httpPack(args.input, {
      config: htmlConfig,
      watch: flags.watch,
      output: detectOutput(),
      template: detectTemplate(flags.template),
      optimized: flags.optimized,
      quiet: flags.quiet,
      host,
      port,
      ssl: flags.ssl,
      cert: flags.cert,
      key: flags.key,
    });
  }
}

HttpCommand.description = `serve HTML documentation`;

HttpCommand.flags = {
  template: flags.string({ char: "t", description: "custom template" }),
  optimized: flags.boolean({ char: "O", description: "optimized mode" }),
  ssl: flags.boolean({
    char: "S",
    description: "enable https",
    dependsOn: ["cert", "key"],
  }),
  cert: flags.string({ char: "C", description: "SSL cert file" }),
  key: flags.string({ char: "K", description: "SSL key file" }),
  bind: flags.string({
    char: "b",
    description: "listen address",
    default: ":8088",
  }),
  watch: flags.boolean({
    char: "w",
    description: "watch for the files changes",
  }),
  quiet: flags.boolean({ char: "q", description: "quiet mode" }),
};

export default HttpCommand;
