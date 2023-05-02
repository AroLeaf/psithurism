export interface CliArgumentOptions {
  name: string;
  description?: string;
  required?: boolean;
  transform?: (value: string) => any;
}

export interface CliFlagOptions extends CliArgumentOptions {
  short?: string;
  long?: string;
  args?: CliArgumentOptions[];
  transform?: (value: any) => any;
}

export interface CliOptions {
  positional: CliArgumentOptions[];
  flags: CliFlagOptions[];
}

export default function cli(args: string[], options: CliOptions) {
  const out: { [key: string]: any } = { _rest: [] }

  let current = 0;

  // Parse arguments for a flag
  const parseFlagArguments = (flag: CliFlagOptions) => {
    if (!flag.args) return true;
    const out: { [key: string]: any } = {}
    
    while (current < args.length) {
      const arg = args[current++];
      if (arg.startsWith('-')) {
        current--;
        for (const argOptions of flag.args) {
          if (argOptions.required && !out[argOptions.name]) throw new Error(`Missing required argument for flag ${flag.name}: ${argOptions.name}`);
        }
        break;
      }
      const argOptions = flag.args.find(a => !out[a.name]);
      if (!argOptions) {
        current--;
        break;
      }
      out[argOptions.name] = argOptions.transform ? argOptions.transform(arg) : arg;
    }
    
    return flag.args.length === 1 && flag.args[0].name === flag.name ? out[flag.name] : out;
  }

  while (current < args.length) {
    const arg = args[current++];
    if (arg.startsWith('--')) {
      const flag = arg.slice(2);
      const flagOptions = options.flags.find(f => (f.long || f.name) === flag);
      if (!flagOptions) throw new Error(`Unknown flag: ${flag}`);
      const res = parseFlagArguments(flagOptions);
      out[flagOptions.name] = flagOptions.transform ? flagOptions.transform(res) : res;
    }
    else if (arg.startsWith('-')) {
      const flags = arg.slice(1);
      for (const flag of flags) {
        const flagOptions = options.flags.find(f => f.short === flag);
        if (!flagOptions) throw new Error(`Unknown flag: ${flag}`);
        const res = parseFlagArguments(flagOptions);
        out[flagOptions.name] = flagOptions.transform ? flagOptions.transform(res) : res;
      }
    }
    else {
      const positional = options.positional.find(p => !out[p.name]);
      // if all positional arguments have been satisfied, push the rest to out._rest
      if (!positional) {
        out._rest.push(arg);
        continue;
      }
      out[positional.name] = positional.transform ? positional.transform(arg) : arg;
    }
  }
  
  // Check for missing required arguments
  for (const positional of options.positional) {
    if (positional.required && !out[positional.name]) throw new Error(`Missing required positional argument: ${positional.name}`);
  }
  for (const flag of options.flags) {
    if (flag.required && !out[flag.name]) throw new Error(`Missing required flag: ${flag.name}`);
  }
  
  return out;
}