import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const TEST = () => {
  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.editButtonText}>
          {isViewOnly ? 'Back' : 'Edit'}
        </Text>
      </TouchableOpacity>

      {!isViewOnly && surFormGenFlg === 'Y' && (
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleFormSubmit}
          disabled={isFormSubmitLoading || isConfirming}
        >
          {isFormSubmitLoading || isConfirming ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      )}

      {!isViewOnly && surFormGenFlg !== 'Y' && (
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: COLORS.gray[400] }]}
          disabled={true}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TEST;

const styles = StyleSheet.create({});
