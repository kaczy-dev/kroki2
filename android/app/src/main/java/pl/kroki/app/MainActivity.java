package pl.kroki.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import pl.kroki.app.plugins.StepCounterPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register native step counter plugin
        registerPlugin(StepCounterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
