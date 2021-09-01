const Applet = imports.ui.applet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

function run(cmd) {
  try {
    let [_result, stdout, _stderr] = GLib.spawn_command_line_sync(cmd);
    if (stdout !== null) {
      return stdout.toString();
    }
  } catch (error) {
    global.logError(error.message);
  }
}

function getStatus() {
  const output = run('/usr/bin/ideapad-cm status');
  const status = output.match(/(enabled|disabled)\.\s*$/)[1];
  return status;
}

function toggle() {
  const status = getStatus();

  // Defaults
  let target = "enable";
  let targetNotify = "enabled";

  if (status === 'enabled') {
    target = "disable";
    targetNotify = "disabled";
  }

  GLib.spawn_command_line_sync(`/usr/bin/sudo /usr/bin/ideapad-cm ${target}`);
  GLib.spawn_command_line_async(`/usr/bin/notify-send --hint=int:transient:1 -t 2000 "Battery Conservation Mode" "Battery conservation ${targetNotify}"`);
}

class MyApplet extends Applet.IconApplet {
  constructor(orientation, panelHeight, instanceId) {
    super(orientation, panelHeight, instanceId);

    this.updateIcon = this.updateIcon.bind(this);
    this.updateIcon();
    this.set_applet_tooltip(_('Click to toggle battery conservation mode'));
    this.addUpdateLoop();
  }

  updateIcon() {
    const status = getStatus();
    if (status === 'enabled') {
      this.set_applet_icon_name("battery-leaf");
    } else {
      this.set_applet_icon_name("battery-lightning");
    }
  }

  update() {
    this.updateIcon();
    return this.shouldUpdate;
  }

  addUpdateLoop() {
    // Start the update loop and allow updates
    this.loopId = Mainloop.timeout_add(60000, Lang.bind(this, this.update));
    this.shouldUpdate = true;
  }

  removeUpdateLoop() {
    // Remove the update loop and stop updates
    if (this.loopId) {
      Mainloop.source_remove(this.loopId);
    }
    this.shouldUpdate = false;
  }

  on_applet_clicked() {
    global.log('Toggling battery conservation mode');
    toggle();
    this.updateIcon();
  }

  on_applet_removed_from_panel() {
    this.removeUpdateLoop();
  }
}

function main(_metadata, orientation, panelHeight, instanceId) {
    return new MyApplet(orientation, panelHeight, instanceId);
}
