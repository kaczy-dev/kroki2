package pl.kroki.app.plugins;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.Manifest;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * Native Step Counter Plugin for Capacitor.
 * Uses Android TYPE_STEP_COUNTER (hardware, runs in background with zero battery cost).
 * 
 * This sensor counts steps from device boot — we track deltas to get daily steps.
 */
@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activity",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        )
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private boolean isListening = false;

    // Step counter is cumulative since boot — we track offset
    private float initialSteps = -1;
    private float currentSteps = 0;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (stepSensor == null) {
            call.reject("Step sensor not available on this device");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+ requires ACTIVITY_RECOGNITION permission
            if (!hasPermission("activity")) {
                requestPermissionForAlias("activity", call, "permissionCallback");
                return;
            }
        }

        startListening(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (isListening) {
            sensorManager.unregisterListener(this);
            isListening = false;
        }
        call.resolve();
    }

    @PluginMethod
    public void getSteps(PluginCall call) {
        JSObject result = new JSObject();
        result.put("steps", getSessionSteps());
        result.put("available", stepSensor != null);
        result.put("listening", isListening);
        call.resolve(result);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", stepSensor != null);
        result.put("type", stepSensor != null ? stepSensor.getName() : "none");
        call.resolve(result);
    }

    @PluginMethod
    public void reset(PluginCall call) {
        initialSteps = currentSteps > 0 ? currentSteps : -1;
        call.resolve();
    }

    private void startListening(PluginCall call) {
        if (isListening) {
            call.resolve();
            return;
        }

        boolean success = sensorManager.registerListener(
            this,
            stepSensor,
            SensorManager.SENSOR_DELAY_FASTEST // Real-time!
        );

        if (success) {
            isListening = true;
            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
        } else {
            call.reject("Failed to register step sensor listener");
        }
    }

    // Permission callback
    @SuppressWarnings("unused")
    private void permissionCallback(PluginCall call) {
        if (hasPermission("activity")) {
            startListening(call);
        } else {
            call.reject("Activity recognition permission denied");
        }
    }

    // ========== SENSOR EVENTS ==========

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            currentSteps = event.values[0];
            if (initialSteps < 0) {
                initialSteps = currentSteps;
            }

            // Notify JavaScript
            JSObject data = new JSObject();
            data.put("steps", getSessionSteps());
            data.put("totalSinceBoot", (int) currentSteps);
            notifyListeners("stepUpdate", data);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not needed for step counter
    }

    private int getSessionSteps() {
        if (initialSteps < 0) return 0;
        return (int) (currentSteps - initialSteps);
    }
}
